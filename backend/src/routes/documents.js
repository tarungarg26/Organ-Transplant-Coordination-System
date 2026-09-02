const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const Document = require("../models/Document");
const { protect, allowRoles } = require("../middleware/auth");
const audit = require("../utils/audit");

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${crypto.randomUUID()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get("/", protect, async (req, res, next) => {
  try {
    const rows = await Document.find().populate("uploadedBy", "name role").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) { next(e); }
});

router.post(
  "/upload",
  protect,
  allowRoles("HOSPITAL", "TRANSPORT", "COORDINATOR", "ADMIN"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: "File is required" });
      const doc = await Document.create({
        fileName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        documentType: req.body.documentType || "Other",
        entityType: req.body.entityType || "TRANSPORT",
        entityId: req.body.entityId,
        uploadedBy: req.user._id
      });
      await audit(req.user, "UPLOAD_DOCUMENT", "DOCUMENT", doc._id, { fileName: doc.fileName });
      res.status(201).json(doc);
    } catch (e) { next(e); }
  }
);

router.get("/:id/download", protect, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    const filePath = path.join(uploadDir, doc.storedName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Stored file not found" });
    res.download(filePath, doc.fileName);
  } catch (e) { next(e); }
});

module.exports = router;

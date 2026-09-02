const router = require("express").Router();
const Donor = require("../models/Donor");
const { protect, allowRoles } = require("../middleware/auth");
const audit = require("../utils/audit");

function makeId() {
  return "DNR-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10);
}

router.get("/", protect, async (req, res, next) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.json(donors);
  } catch (e) { next(e); }
});

router.post("/", protect, allowRoles("HOSPITAL", "ADMIN"), async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      donorId: makeId(),
      hospitalId: req.user.role === "HOSPITAL" ? req.user._id : req.body.hospitalId,
      hospitalName: req.user.role === "HOSPITAL" ? req.user.hospitalName : req.body.hospitalName,
      status: req.body.saveDraft ? "Incomplete" : "Active - Available for Matching"
    };

    if (!data.saveDraft && (!data.consentStatus || !data.name || !data.bloodType || !data.hlaTyping || !data.organType)) {
      return res.status(400).json({ message: "Name, blood type, HLA typing, organ type and consent are required" });
    }

    delete data.saveDraft;
    const donor = await Donor.create(data);
    await audit(req.user, "CREATE_DONOR", "DONOR", donor._id, { status: donor.status });

    const io = req.app.get("io");
    if (io) io.emit("donor-created", donor);

    res.status(201).json(donor);
  } catch (e) { next(e); }
});

router.patch("/:id", protect, allowRoles("HOSPITAL", "ADMIN"), async (req, res, next) => {
  try {
    const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    await audit(req.user, "UPDATE_DONOR", "DONOR", donor._id, req.body);
    res.json(donor);
  } catch (e) { next(e); }
});

module.exports = router;

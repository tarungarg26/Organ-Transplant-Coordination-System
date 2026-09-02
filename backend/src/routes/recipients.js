const router = require("express").Router();
const Recipient = require("../models/Recipient");
const { protect, allowRoles } = require("../middleware/auth");
const audit = require("../utils/audit");

function makeId() {
  return "CAN-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10);
}

async function rerank() {
  const list = await Recipient.find({ status: "Active" }).sort({
    urgencyStatus: 1,
    createdAt: 1
  });
  const weight = { Critical: 1, High: 2, Medium: 3, Low: 4 };
  list.sort((a, b) => (weight[a.urgencyStatus] - weight[b.urgencyStatus]) || (new Date(a.createdAt) - new Date(b.createdAt)));
  await Promise.all(list.map((r, i) => Recipient.findByIdAndUpdate(r._id, { waitlistPosition: i + 1 })));
}

router.get("/", protect, async (req, res, next) => {
  try {
    const recipients = await Recipient.find().sort({ waitlistPosition: 1, createdAt: 1 });
    res.json(recipients);
  } catch (e) { next(e); }
});

router.post("/", protect, allowRoles("HOSPITAL", "ADMIN"), async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      candidateId: makeId(),
      hospitalId: req.user.role === "HOSPITAL" ? req.user._id : req.body.hospitalId,
      hospitalName: req.user.role === "HOSPITAL" ? req.user.hospitalName : req.body.hospitalName
    };

    if (!data.name || !data.bloodType || !data.hlaTyping || !data.requiredOrgan || !data.urgencyStatus) {
      return res.status(400).json({ message: "Name, blood type, HLA typing, required organ and urgency are required" });
    }

    const recipient = await Recipient.create(data);
    await rerank();
    const fresh = await Recipient.findById(recipient._id);
    await audit(req.user, "CREATE_RECIPIENT", "RECIPIENT", recipient._id, { urgency: recipient.urgencyStatus });

    if (recipient.urgencyStatus === "Critical") {
      const io = req.app.get("io");
      if (io) io.emit("critical-recipient", fresh);
    }

    res.status(201).json(fresh);
  } catch (e) { next(e); }
});

router.patch("/:id", protect, allowRoles("HOSPITAL", "ADMIN", "COORDINATOR"), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });
    await rerank();
    await audit(req.user, "UPDATE_RECIPIENT", "RECIPIENT", recipient._id, req.body);
    res.json(await Recipient.findById(recipient._id));
  } catch (e) { next(e); }
});

module.exports = router;

const router = require("express").Router();
const PostTransplantOutcome = require("../models/PostTransplantOutcome");
const Recipient = require("../models/Recipient");
const { protect, allowRoles } = require("../middleware/auth");
const audit = require("../utils/audit");

router.get("/", protect, async (req, res, next) => {
  try {
    res.json(await PostTransplantOutcome.find().populate("recipient").sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});

router.post("/", protect, allowRoles("HOSPITAL", "COORDINATOR", "ADMIN"), async (req, res, next) => {
  try {
    const outcome = await PostTransplantOutcome.create({ ...req.body, recordedBy: req.user._id });
    await Recipient.findByIdAndUpdate(req.body.recipient, { status: "Post-Transplant" });
    await audit(req.user, "RECORD_OUTCOME", "OUTCOME", outcome._id, {});
    res.status(201).json(outcome);
  } catch (e) { next(e); }
});

module.exports = router;

const router = require("express").Router();
const PostTransplantOutcome = require("../models/PostTransplantOutcome");
const Recipient = require("../models/Recipient");
const MatchAllocation = require("../models/MatchAllocation");
const { protect, allowRoles } = require("../middleware/auth");
const audit = require("../utils/audit");

router.get("/", protect, async (req, res, next) => {
  try {
    const list = await PostTransplantOutcome.find()
      .populate("recipient")
      .populate({
        path: "match",
        populate: [{ path: "donor" }]
      })
      .populate("recordedBy", "name email role hospitalName")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (e) { next(e); }
});

router.get("/eligible-recipients", protect, async (req, res, next) => {
  try {
    const recipients = await Recipient.find({
      status: { $in: ["Matched", "Post-Transplant"] }
    }).sort({ updatedAt: -1 });
    res.json(recipients);
  } catch (e) { next(e); }
});

router.post("/", protect, allowRoles("HOSPITAL", "COORDINATOR", "ADMIN"), async (req, res, next) => {
  try {
    const { recipient, surgeryDate, outcome, graftFunction, complications, dischargeStatus, followUpNotes } = req.body;
    if (!recipient || !outcome) {
      return res.status(400).json({ message: "Recipient and outcome status are required" });
    }

    const latestMatch = await MatchAllocation.findOne({
      recipient,
      status: "CONFIRMED"
    }).sort({ createdAt: -1 });

    const doc = await PostTransplantOutcome.create({
      recipient,
      match: latestMatch?._id,
      surgeryDate: surgeryDate || new Date(),
      outcome,
      graftFunction: graftFunction || "Optimal Immediate Function",
      complications,
      dischargeStatus: dischargeStatus || "Inpatient Recovery",
      followUpNotes,
      recordedBy: req.user._id
    });

    await Recipient.findByIdAndUpdate(recipient, { status: "Post-Transplant" });
    await audit(req.user, "RECORD_OUTCOME", "OUTCOME", doc._id, { outcome, graftFunction });

    const populated = await PostTransplantOutcome.findById(doc._id)
      .populate("recipient")
      .populate("recordedBy", "name role");

    res.status(201).json(populated);
  } catch (e) { next(e); }
});

module.exports = router;


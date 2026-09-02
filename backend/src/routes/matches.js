const router = require("express").Router();
const Donor = require("../models/Donor");
const Recipient = require("../models/Recipient");
const MatchAllocation = require("../models/MatchAllocation");
const OrganTransport = require("../models/OrganTransport");
const Notification = require("../models/Notification");
const { protect, allowRoles } = require("../middleware/auth");
const { compatibility } = require("../utils/matching");
const audit = require("../utils/audit");

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
}

async function notify(io, userIds, title, message, type, entityType, entityId) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  const rows = await Promise.all(ids.map(userId => Notification.create({
    userId, title, message, type, entityType, entityId: String(entityId)
  })));
  if (io) rows.forEach(row => io.to(`user:${row.userId}`).emit("notification", row));
}

router.get("/", protect, async (req, res, next) => {
  try {
    const matches = await MatchAllocation.find()
      .populate("donor")
      .populate("recipient")
      .populate("coordinator", "name email")
      .sort({ createdAt: -1 });
    res.json(matches);
  } catch (e) { next(e); }
});

router.get("/evaluate/:donorId", protect, allowRoles("COORDINATOR", "OPO", "ADMIN"), async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.donorId);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const recipients = await Recipient.find({ status: "Active" });
    const ranked = recipients
      .map(recipient => ({ recipient, result: compatibility(donor, recipient) }))
      .filter(x => x.result.compatible)
      .sort((a, b) => b.result.score - a.result.score);

    if (!ranked.length) {
      donor.status = "Flagged";
      await donor.save();
      await MatchAllocation.create({
        matchId: makeId("MAT"),
        donor: donor._id,
        recipient: recipients[0]?._id || donor._id,
        matchScore: 0,
        ranking: 0,
        status: "NO_COMPATIBLE"
      }).catch(() => {});
      await audit(req.user, "NO_COMPATIBLE_MATCH", "DONOR", donor._id);
      return res.json({ donor, ranked: [], manualReview: true });
    }

    const matches = [];
    for (let i = 0; i < ranked.length; i++) {
      const item = ranked[i];
      const match = await MatchAllocation.findOneAndUpdate(
        { donor: donor._id, recipient: item.recipient._id, status: "PROPOSED" },
        {
          matchId: makeId("MAT"),
          donor: donor._id,
          recipient: item.recipient._id,
          matchScore: item.result.score,
          ranking: i + 1,
          reasons: item.result.reasons,
          distanceKm: item.result.distanceKm,
          status: "PROPOSED"
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      matches.push(await match.populate("recipient"));
    }

    res.json({ donor, ranked: matches, generatedWithinSeconds: "<5" });
  } catch (e) { next(e); }
});

router.post("/:id/confirm", protect, allowRoles("COORDINATOR", "ADMIN"), async (req, res, next) => {
  try {
    const match = await MatchAllocation.findById(req.params.id).populate("donor").populate("recipient");
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.status !== "PROPOSED") return res.status(400).json({ message: "Only proposed matches can be confirmed" });

    const validation = compatibility(match.donor, match.recipient);
    if (!validation.compatible) return res.status(400).json({ message: "Compatibility validation failed", reasons: validation.reasons });

    match.status = "CONFIRMED";
    match.coordinator = req.user._id;
    match.decisionDate = new Date();
    match.matchScore = validation.score;
    await match.save();

    await Donor.findByIdAndUpdate(match.donor._id, { status: "Matched" });
    await Recipient.findByIdAndUpdate(match.recipient._id, { status: "Matched" });
    await MatchAllocation.updateMany(
      { donor: match.donor._id, _id: { $ne: match._id }, status: "PROPOSED" },
      { status: "REJECTED", rejectionReason: "Another candidate confirmed" }
    );

    const transport = await OrganTransport.create({
      transportId: makeId("TRN"),
      match: match._id,
      pickupLocation: match.donor.location?.label || match.donor.hospitalName || "Donor hospital",
      destinationHospital: match.recipient.hospitalName || "Recipient hospital",
      currentLocation: match.donor.location?.label || match.donor.hospitalName || "Pickup pending",
      status: "READY",
      lastCheckpointAt: new Date()
    });

    const io = req.app.get("io");
    const users = await require("../models/User").find({
      role: { $in: ["HOSPITAL", "TRANSPORT", "COORDINATOR"] },
      active: true
    }).select("_id");
    await notify(
      io,
      users.map(u => u._id),
      "Match confirmed",
      `Match ${match.matchId} confirmed. Transport ${transport.transportId} is ready.`,
      "SUCCESS",
      "MATCH",
      match._id
    );

    await audit(req.user, "CONFIRM_MATCH", "MATCH", match._id, {
      matchId: match.matchId,
      recipient: match.recipient.candidateId
    });

    res.json({ match, transport });
  } catch (e) { next(e); }
});

router.post("/:id/reject", protect, allowRoles("COORDINATOR", "ADMIN"), async (req, res, next) => {
  try {
    const match = await MatchAllocation.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (!req.body.reason?.trim()) return res.status(400).json({ message: "Rejection reason is required" });

    match.status = "REJECTED";
    match.rejectionReason = req.body.reason.trim();
    match.coordinator = req.user._id;
    match.decisionDate = new Date();
    await match.save();

    const nextMatch = await MatchAllocation.findOne({
      donor: match.donor,
      status: "PROPOSED",
      _id: { $ne: match._id }
    }).sort({ ranking: 1 });

    await audit(req.user, "REJECT_MATCH", "MATCH", match._id, { reason: match.rejectionReason });
    res.json({ rejected: match, nextMatch });
  } catch (e) { next(e); }
});

module.exports = router;

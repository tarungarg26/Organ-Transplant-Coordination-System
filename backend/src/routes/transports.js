const router = require("express").Router();
const OrganTransport = require("../models/OrganTransport");
const MatchAllocation = require("../models/MatchAllocation");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/auth");
const audit = require("../utils/audit");

function elapsedMinutes(t) {
  if (!t?.startedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(t.startedAt).getTime()) / 60000));
}

async function notifyAll(req, title, message, type, entityId) {
  const users = await User.find({ role: { $in: ["COORDINATOR", "HOSPITAL", "TRANSPORT"] }, active: true }).select("_id");
  const rows = await Promise.all(users.map(u => Notification.create({
    userId: u._id, title, message, type, entityType: "TRANSPORT", entityId: String(entityId)
  })));
  const io = req.app.get("io");
  if (io) rows.forEach(row => io.to(`user:${row.userId}`).emit("notification", row));
}

router.get("/", protect, async (req, res, next) => {
  try {
    const rows = await OrganTransport.find().populate({
      path: "match",
      populate: [{ path: "donor" }, { path: "recipient" }]
    }).sort({ createdAt: -1 });
    res.json(rows.map(row => ({ ...row.toObject(), elapsedMinutes: elapsedMinutes(row) })));
  } catch (e) { next(e); }
});

router.patch("/:id", protect, allowRoles("TRANSPORT", "COORDINATOR", "ADMIN"), async (req, res, next) => {
  try {
    const transport = await OrganTransport.findById(req.params.id);
    if (!transport) return res.status(404).json({ message: "Transport not found" });

    const { status, currentLocation, estimatedArrival, exceptionReason } = req.body;
    if (status) transport.status = status;
    if (currentLocation !== undefined) transport.currentLocation = currentLocation;
    if (estimatedArrival) transport.estimatedArrival = estimatedArrival;
    if (exceptionReason) transport.exceptionReason = exceptionReason;

    if (status === "PICKED_UP" || status === "IN_TRANSIT") {
      if (!transport.startedAt) transport.startedAt = new Date();
      transport.lastCheckpointAt = new Date();
    }

    if (status === "DELIVERED") {
      transport.deliveredAt = new Date();
      transport.lastCheckpointAt = new Date();
    }

    transport.checkpoints.push({
      status: transport.status,
      location: transport.currentLocation,
      timestamp: new Date()
    });

    const elapsed = elapsedMinutes(transport);
    const limit = transport.coldIschemiaLimitMinutes;
    const alertPercent = Number(process.env.COLD_ISCHEMIA_ALERT_PERCENT || 80);

    await transport.save();

    if (status === "EXCEPTION") {
      await notifyAll(req, "Delivery exception", exceptionReason || "Transport exception logged", "ERROR", transport._id);
    } else if (elapsed >= (limit * alertPercent) / 100 && !["DELIVERED"].includes(transport.status)) {
      await notifyAll(req, "Cold ischemia alert", `Transport ${transport.transportId} has reached ${elapsed} minutes of elapsed transport time.`, "ALERT", transport._id);
    }

    await audit(req.user, "UPDATE_TRANSPORT", "TRANSPORT", transport._id, { status: transport.status, elapsedMinutes: elapsed });

    const io = req.app.get("io");
    if (io) io.emit("transport-updated", { ...transport.toObject(), elapsedMinutes: elapsed });

    res.json({ ...transport.toObject(), elapsedMinutes: elapsed });
  } catch (e) { next(e); }
});

router.post("/:id/exception", protect, allowRoles("TRANSPORT", "COORDINATOR", "ADMIN"), async (req, res, next) => {
  try {
    if (!req.body.reason?.trim()) return res.status(400).json({ message: "Exception reason is required" });
    const transport = await OrganTransport.findByIdAndUpdate(
      req.params.id,
      { status: "EXCEPTION", exceptionReason: req.body.reason.trim() },
      { new: true }
    );
    if (!transport) return res.status(404).json({ message: "Transport not found" });
    await notifyAll(req, "Transport exception", transport.exceptionReason, "ERROR", transport._id);
    await audit(req.user, "TRANSPORT_EXCEPTION", "TRANSPORT", transport._id, { reason: transport.exceptionReason });
    res.json(transport);
  } catch (e) { next(e); }
});

module.exports = router;

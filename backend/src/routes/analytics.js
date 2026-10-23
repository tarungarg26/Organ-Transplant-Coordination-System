const router = require("express").Router();
const Donor = require("../models/Donor");
const Recipient = require("../models/Recipient");
const MatchAllocation = require("../models/MatchAllocation");
const OrganTransport = require("../models/OrganTransport");
const { protect, allowRoles } = require("../middleware/auth");

router.get("/", protect, allowRoles("ADMIN", "COORDINATOR", "OPO", "AUDITOR"), async (req, res, next) => {
  try {
    const [
      donors,
      recipients,
      confirmed,
      delivered,
      transports,
      hospitals,
      organBreakdown,
      urgencyBreakdown,
      transportStatusBreakdown
    ] = await Promise.all([
      Donor.countDocuments(),
      Recipient.countDocuments(),
      MatchAllocation.countDocuments({ status: "CONFIRMED" }),
      OrganTransport.countDocuments({ status: "DELIVERED" }),
      OrganTransport.find({ startedAt: { $ne: null }, deliveredAt: { $ne: null } }),
      Donor.aggregate([{ $group: { _id: "$hospitalName", donors: { $sum: 1 } } }, { $sort: { donors: -1 } }]),
      Donor.aggregate([{ $group: { _id: "$organType", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Recipient.aggregate([{ $match: { status: "Active" } }, { $group: { _id: "$urgencyStatus", count: { $sum: 1 } } }]),
      OrganTransport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
    ]);

    const avgTransportMinutes = transports.length
      ? Math.round(transports.reduce((sum, t) => sum + ((new Date(t.deliveredAt) - new Date(t.startedAt)) / 60000), 0) / transports.length)
      : 0;

    res.json({
      donors,
      recipients,
      confirmedMatches: confirmed,
      successfulTransplants: delivered,
      avgTransportMinutes,
      hospitalPerformance: hospitals,
      organBreakdown: organBreakdown.map(o => ({ organ: o._id || "Other", count: o.count })),
      urgencyBreakdown: urgencyBreakdown.map(u => ({ urgency: u._id || "Standard", count: u.count })),
      transportStatusBreakdown: transportStatusBreakdown.map(s => ({ status: s._id, count: s.count }))
    });
  } catch (e) { next(e); }
});

module.exports = router;


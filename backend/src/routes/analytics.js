const router = require("express").Router();
const Donor = require("../models/Donor");
const Recipient = require("../models/Recipient");
const MatchAllocation = require("../models/MatchAllocation");
const OrganTransport = require("../models/OrganTransport");
const { protect, allowRoles } = require("../middleware/auth");

router.get("/", protect, allowRoles("ADMIN", "COORDINATOR", "OPO", "AUDITOR"), async (req, res, next) => {
  try {
    const [donors, recipients, confirmed, delivered, transports, hospitals] = await Promise.all([
      Donor.countDocuments(),
      Recipient.countDocuments(),
      MatchAllocation.countDocuments({ status: "CONFIRMED" }),
      MatchAllocation.countDocuments({ status: "CONFIRMED" }),
      OrganTransport.find({ startedAt: { $ne: null }, deliveredAt: { $ne: null } }),
      Donor.aggregate([{ $group: { _id: "$hospitalName", donors: { $sum: 1 } } }, { $sort: { donors: -1 } }])
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
      hospitalPerformance: hospitals
    });
  } catch (e) { next(e); }
});

module.exports = router;

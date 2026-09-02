const router = require("express").Router();
const MatchAllocation = require("../models/MatchAllocation");
const AuditLog = require("../models/AuditLog");
const { protect, allowRoles } = require("../middleware/auth");

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

router.get("/compliance.csv", protect, allowRoles("ADMIN", "OPO", "AUDITOR", "COORDINATOR"), async (req, res, next) => {
  try {
    const rows = await MatchAllocation.find()
      .populate("donor", "donorId name bloodType organType")
      .populate("recipient", "candidateId name bloodType requiredOrgan urgencyStatus")
      .populate("coordinator", "name email")
      .sort({ decisionDate: -1 });

    const lines = [
      ["Match ID", "Donor ID", "Recipient ID", "Donor", "Recipient", "Score", "Status", "Coordinator", "Decision Date", "Rejection Reason"]
    ];
    rows.forEach(r => lines.push([
      r.matchId, r.donor?.donorId, r.recipient?.candidateId, r.donor?.name, r.recipient?.name,
      r.matchScore, r.status, r.coordinator?.name, r.decisionDate?.toISOString(), r.rejectionReason
    ]));

    const csv = lines.map(row => row.map(csvEscape).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="otcs-compliance-report.csv"');
    res.send(csv);
  } catch (e) { next(e); }
});

router.get("/audit", protect, allowRoles("ADMIN", "OPO", "AUDITOR"), async (req, res, next) => {
  try {
    res.json(await AuditLog.find().sort({ createdAt: -1 }).limit(500));
  } catch (e) { next(e); }
});

module.exports = router;

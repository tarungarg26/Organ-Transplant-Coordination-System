const AuditLog = require("../models/AuditLog");

async function audit(user, action, entityType, entityId, details = {}) {
  try {
    await AuditLog.create({
      userId: user?._id,
      userName: user?.name || "System",
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      details
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
}

module.exports = audit;

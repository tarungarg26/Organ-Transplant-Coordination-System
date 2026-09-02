const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: String,
  action: { type: String, required: true },
  entityType: String,
  entityId: String,
  details: mongoose.Schema.Types.Mixed
}, { timestamps: true });

schema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", schema);

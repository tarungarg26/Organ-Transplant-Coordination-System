const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  message: String,
  type: { type: String, default: "INFO" },
  read: { type: Boolean, default: false },
  entityType: String,
  entityId: String
}, { timestamps: true });

module.exports = mongoose.model("Notification", schema);

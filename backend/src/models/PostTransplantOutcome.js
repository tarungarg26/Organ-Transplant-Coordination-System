const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", required: true },
  surgeryDate: Date,
  outcome: String,
  followUpNotes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("PostTransplantOutcome", schema);

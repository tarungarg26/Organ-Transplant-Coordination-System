const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", required: true },
  match: { type: mongoose.Schema.Types.ObjectId, ref: "MatchAllocation" },
  surgeryDate: { type: Date, default: Date.now },
  outcome: { type: String, required: true },
  graftFunction: {
    type: String,
    enum: ["Optimal Immediate Function", "Delayed Graft Function", "Acute Cellular Rejection", "Primary Non-Function"],
    default: "Optimal Immediate Function"
  },
  complications: String,
  dischargeStatus: {
    type: String,
    enum: ["Discharged - Stable", "Inpatient Recovery", "ICU Monitoring", "Expired"],
    default: "Inpatient Recovery"
  },
  followUpNotes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("PostTransplantOutcome", schema);


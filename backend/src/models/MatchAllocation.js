const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  matchId: { type: String, unique: true, index: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", required: true },
  matchScore: Number,
  ranking: Number,
  reasons: [String],
  distanceKm: Number,
  status: {
    type: String,
    enum: ["PROPOSED", "CONFIRMED", "REJECTED", "NO_COMPATIBLE", "MANUAL_REVIEW"],
    default: "PROPOSED"
  },
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectionReason: String,
  decisionDate: Date
}, { timestamps: true });

module.exports = mongoose.model("MatchAllocation", schema);

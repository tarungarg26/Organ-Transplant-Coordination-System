const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  transportId: { type: String, unique: true, index: true },
  match: { type: mongoose.Schema.Types.ObjectId, ref: "MatchAllocation", required: true },
  status: {
    type: String,
    enum: ["READY", "PICKED_UP", "IN_TRANSIT", "DELAYED", "DELIVERED", "EXCEPTION"],
    default: "READY"
  },
  pickupLocation: String,
  destinationHospital: String,
  currentLocation: String,
  estimatedArrival: Date,
  coldIschemiaLimitMinutes: { type: Number, default: 360 },
  startedAt: Date,
  deliveredAt: Date,
  lastCheckpointAt: Date,
  exceptionReason: String,
  checkpoints: [{
    status: String,
    location: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("OrganTransport", schema);

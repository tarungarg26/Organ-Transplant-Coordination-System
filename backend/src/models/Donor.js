const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  donorId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  dateOfBirth: Date,
  contactNumber: String,
  bloodType: { type: String, required: true },
  hlaTyping: { type: String, required: true },
  consentStatus: { type: Boolean, required: true },
  organType: { type: String, required: true },
  organSize: Number,
  medicalHistory: String,
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  hospitalName: String,
  status: {
    type: String,
    enum: ["Incomplete", "Active - Available for Matching", "Matched", "Closed", "Flagged"],
    default: "Incomplete"
  },
  location: {
    lat: Number,
    lng: Number,
    label: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Donor", schema);

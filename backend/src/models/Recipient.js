const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  candidateId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  dateOfBirth: Date,
  contactNumber: String,
  bloodType: { type: String, required: true },
  hlaTyping: { type: String, required: true },
  requiredOrgan: { type: String, required: true },
  organSize: Number,
  medicalHistory: String,
  urgencyStatus: {
    type: String,
    enum: ["Critical", "High", "Medium", "Low"],
    required: true
  },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  hospitalName: String,
  waitlistPosition: Number,
  status: {
    type: String,
    enum: ["Active", "Matched", "Post-Transplant", "Inactive"],
    default: "Active"
  },
  location: {
    lat: Number,
    lng: Number,
    label: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Recipient", schema);

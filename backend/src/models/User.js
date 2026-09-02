const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["ADMIN", "HOSPITAL", "COORDINATOR", "TRANSPORT", "OPO", "AUDITOR"],
    required: true
  },
  hospitalName: String,
  phone: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("User", schema);

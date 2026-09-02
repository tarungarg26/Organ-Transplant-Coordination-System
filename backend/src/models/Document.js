const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  fileName: String,
  storedName: String,
  mimeType: String,
  size: Number,
  documentType: {
    type: String,
    enum: ["Medical Report", "Consent Form", "Laboratory Report", "Transport Document", "Other"]
  },
  entityType: { type: String, enum: ["DONOR", "RECIPIENT", "MATCH", "TRANSPORT"] },
  entityId: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Document", schema);

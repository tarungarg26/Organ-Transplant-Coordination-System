require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Donor = require("./models/Donor");
const Recipient = require("./models/Recipient");

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Donor.deleteMany({}),
    Recipient.deleteMany({})
  ]);

  const password = await bcrypt.hash("Password@123", 10);

  const users = await User.insertMany([
    { name: "OTCS Administrator", email: "admin@otcs.local", password, role: "ADMIN", phone: "9000000001" },
    { name: "Hospital Staff", email: "hospital@otcs.local", password, role: "HOSPITAL", hospitalName: "Chennai Central Transplant Hospital", phone: "9000000002" },
    { name: "Transplant Coordinator", email: "coordinator@otcs.local", password, role: "COORDINATOR", phone: "9000000003" },
    { name: "Transport Dispatcher", email: "transport@otcs.local", password, role: "TRANSPORT", phone: "9000000004" },
    { name: "OPO Officer", email: "opo@otcs.local", password, role: "OPO", phone: "9000000005" },
    { name: "Regulatory Auditor", email: "auditor@otcs.local", password, role: "AUDITOR", phone: "9000000006" }
  ]);

  const hospital = users.find(u => u.role === "HOSPITAL");

  await Donor.insertMany([
    {
      donorId: "DNR-DEMO01",
      name: "Demo Donor A",
      bloodType: "O+",
      hlaTyping: "A2 B7 DR4",
      consentStatus: true,
      organType: "Kidney",
      organSize: 8,
      medicalHistory: "Demo data only",
      hospitalId: hospital._id,
      hospitalName: hospital.hospitalName,
      status: "Active - Available for Matching",
      location: { lat: 13.0827, lng: 80.2707, label: "Chennai" }
    }
  ]);

  await Recipient.insertMany([
    {
      candidateId: "CAN-DEMO01",
      name: "Demo Recipient A",
      bloodType: "A+",
      hlaTyping: "A2 B7 DR4",
      requiredOrgan: "Kidney",
      organSize: 8,
      medicalHistory: "Demo data only",
      urgencyStatus: "Critical",
      hospitalId: hospital._id,
      hospitalName: "Chennai Central Transplant Hospital",
      status: "Active",
      location: { lat: 12.9716, lng: 80.2180, label: "Chennai South" }
    },
    {
      candidateId: "CAN-DEMO02",
      name: "Demo Recipient B",
      bloodType: "B+",
      hlaTyping: "A2 B8 DR3",
      requiredOrgan: "Kidney",
      organSize: 7,
      medicalHistory: "Demo data only",
      urgencyStatus: "High",
      hospitalId: hospital._id,
      hospitalName: "Chennai Central Transplant Hospital",
      status: "Active",
      location: { lat: 13.0475, lng: 80.2824, label: "Chennai East" }
    }
  ]);

  console.log("Seed complete. Demo password: Password@123");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

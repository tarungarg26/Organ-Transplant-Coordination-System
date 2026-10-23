const mongoose = require("mongoose");

let isConnecting = false;

async function tryConnect() {
  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 6000
    });
    console.log("\x1b[32m%s\x1b[0m", "✓ MongoDB connected successfully");
  } catch (err) {
    console.warn("\n\x1b[33m%s\x1b[0m", "========================================================");
    console.warn("\x1b[33m%s\x1b[0m", "⚠️  MongoDB Atlas Connection Notice:");
    console.warn("\x1b[33m%s\x1b[0m", "Could not connect to MongoDB Atlas cluster.");
    console.warn("\x1b[33m%s\x1b[0m", "Cause: Network Access / IP Whitelist or Cluster Paused.");
    console.warn("\x1b[36m%s\x1b[0m", "\n👉 Quick fix in MongoDB Atlas (takes 1 minute):");
    console.warn("1. Open https://cloud.mongodb.com");
    console.warn("2. Go to 'Security' -> 'Network Access'");
    console.warn("3. Click 'Add IP Address' -> Select 'Allow Access from Anywhere' (0.0.0.0/0)");
    console.warn("4. Confirm and wait 1 minute. Retrying in background...\n");
    console.warn("\x1b[33m%s\x1b[0m", "========================================================\n");

    // Retry connection in background every 15 seconds
    setTimeout(tryConnect, 15000);
  } finally {
    isConnecting = false;
  }
}

async function connectDB() {
  await tryConnect();
}

module.exports = connectDB;

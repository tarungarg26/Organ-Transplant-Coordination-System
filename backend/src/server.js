require("dotenv").config();
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");

const port = process.env.PORT || 5000;
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(",") || "*"
    }
  });

  app.set("io", io);

  io.on("connection", socket => {
    socket.on("join-user", userId => {
      if (userId) socket.join(`user:${userId}`);
    });
  });

  server.listen(port, () => {
    console.log(`OTCS API running on http://localhost:${port}`);
    startColdIschemiaDaemon(io);
  });
}

function startColdIschemiaDaemon(io) {
  const OrganTransport = require("./models/OrganTransport");
  const Notification = require("./models/Notification");
  const User = require("./models/User");

  console.log("✓ Autonomous Cold-Ischemia Alert Daemon initialized (30s interval)");

  const interval = setInterval(async () => {
    try {
      const activeTransports = await OrganTransport.find({
        status: { $in: ["PICKED_UP", "IN_TRANSIT"] },
        startedAt: { $ne: null }
      }).populate({
        path: "match",
        populate: [{ path: "donor" }, { path: "recipient" }]
      });

      const alertPercent = Number(process.env.COLD_ISCHEMIA_ALERT_PERCENT || 80);

      for (const t of activeTransports) {
        const elapsed = Math.max(0, Math.floor((Date.now() - new Date(t.startedAt).getTime()) / 60000));
        const limit = t.coldIschemiaLimitMinutes || 360;
        const threshold = (limit * alertPercent) / 100;

        if (elapsed >= threshold) {
          // Avoid duplicate alerts within 10 minutes
          const recentAlert = await Notification.findOne({
            entityType: "TRANSPORT",
            entityId: String(t._id),
            type: "ALERT",
            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
          });

          if (!recentAlert) {
            const users = await User.find({
              role: { $in: ["COORDINATOR", "HOSPITAL", "TRANSPORT"] },
              active: true
            }).select("_id");

            const organ = t.match?.donor?.organType || "Organ";
            const percent = Math.round((elapsed / limit) * 100);
            const msg = `CRITICAL ALERT: Transport ${t.transportId} (${organ}) has reached ${elapsed}m of ${limit}m cold ischemia limit (${percent}%). Immediate delivery action required!`;

            const rows = await Promise.all(users.map(u => Notification.create({
              userId: u._id,
              title: "Cold Ischemia Threshold Exceeded",
              message: msg,
              type: "ALERT",
              entityType: "TRANSPORT",
              entityId: String(t._id)
            })));

            if (io) {
              rows.forEach(r => io.to(`user:${r.userId}`).emit("notification", r));
              io.emit("cold-ischemia-alert", {
                transportId: t.transportId,
                organType: organ,
                elapsedMinutes: elapsed,
                limitMinutes: limit,
                percent
              });
            }
          }
        }
      }
    } catch (err) {
      // Background daemon gracefully handles connection or schema errors without crashing
    }
  }, 30000);

  interval.unref();
}

start().catch(error => {
  console.error(error);
  process.exit(1);
});

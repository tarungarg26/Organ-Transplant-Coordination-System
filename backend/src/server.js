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
  });
}

start().catch(error => {
  console.error(error);
  process.exit(1);
});

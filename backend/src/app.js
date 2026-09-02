const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const donorRoutes = require("./routes/donors");
const recipientRoutes = require("./routes/recipients");
const matchRoutes = require("./routes/matches");
const transportRoutes = require("./routes/transports");
const notificationRoutes = require("./routes/notifications");
const documentRoutes = require("./routes/documents");
const analyticsRoutes = require("./routes/analytics");
const outcomeRoutes = require("./routes/outcomes");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || "*", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_DIR || "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "OTCS API" }));

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/transports", transportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/outcomes", outcomeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

module.exports = app;

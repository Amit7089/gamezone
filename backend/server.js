import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import rechargeRoutes from "./routes/rechargeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";

dotenv.config();

const app = express();

// Hide Express version
app.disable("x-powered-by");

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON requests
app.use(express.json({ limit: "10kb" }));

// General API rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// API home
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GameZone backend API is running",
  });
});

// Database health check
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    message: connected
      ? "API and database are healthy"
      : "Database is not connected",
    database: connected ? "connected" : "disconnected",
  });
});

// ===============================
// API ROUTES
// ===============================

// Authentication
app.use("/api/auth", authRoutes);

// User Profile
app.use("/api/profile", profileRoutes);

// Recharge
app.use("/api/recharge", rechargeRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// Payments
app.use("/api/payments", paymentRoutes);

// Wallet
// GET /api/wallet/summary
app.use("/api/wallet", walletRoutes);

// Withdrawals
// GET  /api/withdrawals/balance
// GET  /api/withdrawals/my
// POST /api/withdrawals
app.use("/api/withdrawals", withdrawalRoutes);

// ===============================
// GLOBAL ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const status =
    Number.isInteger(err.status) &&
    err.status >= 400 &&
    err.status < 600
      ? err.status
      : 500;

  res.status(status).json({
    success: false,
    message:
      status < 500
        ? err.message
        : "Internal server error",
  });
});

// ===============================
// 404 - UNKNOWN API ROUTES
// ===============================

app.use((req, res) => {
  console.log("404 Route Not Found:", req.method, req.originalUrl);

  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// ===============================
// START SERVER
// ===============================

async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log("------------------------------------");
      console.log("GameZone Backend Started Successfully");
      console.log("------------------------------------");

      console.log(`Server Port: ${PORT}`);
      console.log(`Health URL: http://localhost:${PORT}/api/health`);

      console.log("------------------------------------");
      console.log("REGISTERED API ROUTES");
      console.log("------------------------------------");

      console.log("Auth:        /api/auth");
      console.log("Profile:     /api/profile");
      console.log("Recharge:    /api/recharge");
      console.log("Admin:       /api/admin");
      console.log("Payments:    /api/payments");

      console.log("Wallet:      /api/wallet/summary");
      console.log("Withdrawals: /api/withdrawals/balance");
      console.log("Withdrawals: /api/withdrawals/my");
      console.log("Withdrawals: POST /api/withdrawals");

      console.log("------------------------------------");
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

startServer();

import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
} from "../controllers/adminController.js";

import {
  getAdminWithdrawals,
  reviewWithdrawal,
  markWithdrawalPaid,
} from "../controllers/withdrawalController.js";

const router = express.Router();

// All admin routes require authentication and admin role.
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get("/dashboard", getAdminDashboard);

// User Management
router.get("/users", getAdminUsers);
router.patch("/users/:userId/status", updateUserStatus);

// Withdrawal Management

// Get all withdrawal requests
router.get("/withdrawals", getAdminWithdrawals);

// Approve or reject withdrawal request
router.patch(
  "/withdrawals/:id/review",
  reviewWithdrawal
);

// Mark withdrawal as paid after successful payout
router.patch(
  "/withdrawals/:id/paid",
  markWithdrawalPaid
);

export default router;

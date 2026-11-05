
import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  getAdminUserWallet,
  adjustUserWallet,
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

// User Wallet Management
router.get("/users/:userId/wallet", getAdminUserWallet);
router.patch("/users/:userId/wallet", adjustUserWallet);

// Withdrawal Management
router.get("/withdrawals", getAdminWithdrawals);

router.patch(
  "/withdrawals/:id/review",
  reviewWithdrawal
);

router.patch(
  "/withdrawals/:id/paid",
  markWithdrawalPaid
);

export default router;

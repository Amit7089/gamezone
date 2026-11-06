
import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  getAdminUserWallet,
  adjustUserWallet,
  getAdminPurchases,
  updatePurchaseStatus,
} from "../controllers/adminController.js";

import {
  getAdminWithdrawals,
  reviewWithdrawal,
  markWithdrawalPaid,
} from "../controllers/withdrawalController.js";

const router = express.Router();

// All admin routes require authentication and admin role.
router.use(authMiddleware, adminMiddleware);

// ========================================
// ADMIN DASHBOARD
// ========================================

router.get("/dashboard", getAdminDashboard);

// ========================================
// USER MANAGEMENT
// ========================================

router.get("/users", getAdminUsers);

router.patch(
  "/users/:userId/status",
  updateUserStatus
);

// ========================================
// USER WALLET MANAGEMENT
// ========================================

router.get(
  "/users/:userId/wallet",
  getAdminUserWallet
);

router.patch(
  "/users/:userId/wallet",
  adjustUserWallet
);

// ========================================
// PRODUCT PURCHASE MANAGEMENT
// ========================================

router.get(
  "/purchases",
  getAdminPurchases
);

// Update purchase status and credit referral commission
// Commission is credited only when status becomes delivered.
router.patch(
  "/purchases/:purchaseId/status",
  updatePurchaseStatus
);

// ========================================
// WITHDRAWAL MANAGEMENT
// ========================================

router.get(
  "/withdrawals",
  getAdminWithdrawals
);

router.patch(
  "/withdrawals/:id/review",
  reviewWithdrawal
);

router.patch(
  "/withdrawals/:id/paid",
  markWithdrawalPaid
);

export default router;

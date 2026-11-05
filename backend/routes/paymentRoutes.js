
import express from "express";

import {
  getPaymentSettings,
  getAdminPaymentSettings,
  updatePaymentSettings,
  submitPayment,
  getMyPayments,
  getAdminPayments,
  reviewPayment,
  uploadQRCode,
} from "../controllers/paymentController.js";

import isAuthenticated from "../middleware/isAuthenticated.js";
import isAdmin from "../middleware/isAdmin.js";
import uploadQR from "../middleware/uploadQR.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get enabled payment settings
router.get("/settings", getPaymentSettings);


// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Submit payment reference
router.post(
  "/transactions",
  isAuthenticated,
  submitPayment
);

// Get current user's payment history
router.get(
  "/my-transactions",
  isAuthenticated,
  getMyPayments
);


// ==========================================
// ADMIN PAYMENT SETTINGS ROUTES
// ==========================================

// Get payment settings
router.get(
  "/admin/settings",
  isAuthenticated,
  isAdmin,
  getAdminPaymentSettings
);

// Update payment settings
router.put(
  "/admin/settings",
  isAuthenticated,
  isAdmin,
  updatePaymentSettings
);

// Upload QR image directly
router.post(
  "/admin/upload-qr",
  isAuthenticated,
  isAdmin,
  uploadQR.single("qrImage"),
  uploadQRCode
);


// ==========================================
// ADMIN TRANSACTION ROUTES
// ==========================================

// Get all payment transactions
router.get(
  "/admin/transactions",
  isAuthenticated,
  isAdmin,
  getAdminPayments
);

// Approve or reject a payment transaction
router.patch(
  "/admin/transactions/:transactionId/review",
  isAuthenticated,
  isAdmin,
  reviewPayment
);

export default router;

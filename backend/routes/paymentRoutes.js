
import express from "express";

import {
  getPaymentSettings,
  getAdminPaymentSettings,
  updatePaymentSettings,
  submitPayment,
  getMyPayments,
  getAdminPayments,
  reviewPayment,
} from "../controllers/paymentController.js";

// Important: your folder name is "middleware" (singular)
import isAuthenticated from "../middleware/isAuthenticated.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

// Public: return enabled payment settings
router.get("/settings", getPaymentSettings);

// Customer: submit a payment record
router.post(
  "/transactions",
  isAuthenticated,
  submitPayment
);

// Customer: view their own payment records
router.get(
  "/my-transactions",
  isAuthenticated,
  getMyPayments
);

// Admin: get payment settings
router.get(
  "/admin/settings",
  isAuthenticated,
  isAdmin,
  getAdminPaymentSettings
);

// Admin: update payment settings
router.put(
  "/admin/settings",
  isAuthenticated,
  isAdmin,
  updatePaymentSettings
);

// Admin: view all payment transactions
router.get(
  "/admin/transactions",
  isAuthenticated,
  isAdmin,
  getAdminPayments
);

// Admin: approve or reject a transaction
router.patch(
  "/admin/transactions/:transactionId/review",
  isAuthenticated,
  isAdmin,
  reviewPayment
);

export default router;

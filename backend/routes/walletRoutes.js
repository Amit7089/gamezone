import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  getMyWalletBalance,
} from "../controllers/withdrawalController.js";

import {
  getAvailableProducts,
  purchaseProduct,
  getMyPurchases,
} from "../controllers/purchaseController.js";

const router = express.Router();

router.get("/summary", authMiddleware, getMyWalletBalance);

router.get("/products", authMiddleware, getAvailableProducts);

router.post("/purchase", authMiddleware, purchaseProduct);

router.get("/my-purchases", authMiddleware, getMyPurchases);

export default router;
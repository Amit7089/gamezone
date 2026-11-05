import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getMyWalletBalance,
} from "../controllers/withdrawalController.js";

const router = express.Router();

// User: Wallet summary
router.get("/summary", authMiddleware, getMyWalletBalance);

export default router;
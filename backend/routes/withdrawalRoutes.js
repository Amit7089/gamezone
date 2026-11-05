
import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  createWithdrawal,
  getMyWithdrawals,
} from "../controllers/withdrawalController.js";

const router = express.Router();

// User: Create withdrawal request
router.post("/", authMiddleware, createWithdrawal);

// User: View withdrawal history
router.get("/my", authMiddleware, getMyWithdrawals);

export default router;

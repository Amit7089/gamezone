import express from "express";
import { getRechargeRecords } from "../controllers/rechargeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getRechargeRecords);

export default router;

import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  getMyReferralDetails,
  getMyTeam,
  getReferralEarnings,
} from "../controllers/referralController.js";

const router = express.Router();

// All referral routes require login.
router.use(authMiddleware);

router.get("/me", getMyReferralDetails);

router.get("/team", getMyTeam);

router.get("/earnings", getReferralEarnings);

export default router;

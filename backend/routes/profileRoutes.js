
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/profile/me
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

export default router;

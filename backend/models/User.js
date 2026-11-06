
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    mobileNumber: {
      type: String,
      trim: true,
      match: /^[6-9]\d{9}$/,
      default: undefined,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Unique referral code belonging to this user
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // User who referred this account
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Referral code entered during registration
    referralCodeUsed: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

// New mobile numbers must be unique.
// Sparse index allows existing users without a mobile number.
userSchema.index(
  { mobileNumber: 1 },
  { unique: true, sparse: true }
);

export default mongoose.models.User ||
  mongoose.model("User", userSchema);

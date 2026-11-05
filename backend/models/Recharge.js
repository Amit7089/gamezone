
import mongoose from "mongoose";

const rechargeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },
    orderId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },
    paymentId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NETBANKING", "OTHER"],
      default: "OTHER",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

rechargeSchema.index({ user: 1, createdAt: -1 });

const Recharge = mongoose.model("Recharge", rechargeSchema);

export default Recharge;

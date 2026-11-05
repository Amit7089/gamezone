import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderReference: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["product", "service"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    utr: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

paymentTransactionSchema.index(
  { orderReference: 1, utr: 1 },
  { unique: true }
);

export default mongoose.model(
  "PaymentTransaction",
  paymentTransactionSchema
);
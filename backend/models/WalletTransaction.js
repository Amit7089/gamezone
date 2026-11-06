
import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "deposit",
        "income",
        "withdrawal",
        "hold",
        "release",
        "purchase",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    status: {
      type: String,
      enum: ["posted", "pending", "reversed"],
      default: "pending",
      index: true,
    },

    sourceType: {
      type: String,
      enum: [
        "paymentTransaction",
        "incomeRecord",
        "withdrawalRequest",
        "adminAdjustment",
        "productPurchase",
        "registrationReward",
      ],
      required: true,
    },

    sourceId: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate transactions for the same source and type.
walletTransactionSchema.index(
  { sourceType: 1, sourceId: 1, type: 1 },
  { unique: true }
);

walletTransactionSchema.index({
  user: 1,
  status: 1,
  type: 1,
});

export default mongoose.models.WalletTransaction ||
  mongoose.model("WalletTransaction", walletTransactionSchema);


import mongoose from "mongoose";

const productPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    productId: {
      type: String,
      required: true,
      trim: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    productImage: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    // Only purchase and cancellation status
    status: {
      type: String,
      enum: ["purchased", "cancelled"],
      default: "purchased",
      index: true,
    },

    requestId: {
      type: String,
      required: true,
      trim: true,
    },

    purchasedAt: {
      type: Date,
      default: Date.now,
    },

    // Referral commission tracking
    referralCommission: {
      referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      rate: {
        type: Number,
        default: 4,
        min: 0,
        max: 100,
      },

      amount: {
        type: Number,
        default: 0,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          "not_applicable",
          "pending",
          "credited",
          "reversed",
        ],
        default: "not_applicable",
      },

      creditedAt: {
        type: Date,
        default: null,
      },

      walletTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WalletTransaction",
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate purchases for the same user and request
productPurchaseSchema.index(
  { user: 1, requestId: 1 },
  { unique: true }
);

// User purchase history
productPurchaseSchema.index({
  user: 1,
  purchasedAt: -1,
});

// Referrer commission history
productPurchaseSchema.index({
  "referralCommission.referrer": 1,
  "referralCommission.status": 1,
});

export default mongoose.models.ProductPurchase ||
  mongoose.model("ProductPurchase", productPurchaseSchema);

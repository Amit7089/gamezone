
import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
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
    },

    method: {
      type: String,
      enum: ["upi", "bank"],
      required: true,
    },

    accountDetails: {
      accountHolderName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      upiId: {
        type: String,
        default: "",
        trim: true,
      },

      accountNumber: {
        type: String,
        default: "",
        trim: true,
      },

      ifscCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      bankName: {
        type: String,
        default: "",
        trim: true,
      },
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "paid",
      ],
      default: "pending",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    payoutReference: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
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

    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

withdrawalRequestSchema.index({
  user: 1,
  createdAt: -1,
});

export default mongoose.models.WithdrawalRequest ||
  mongoose.model("WithdrawalRequest", withdrawalRequestSchema);

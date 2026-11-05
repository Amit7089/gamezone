import mongoose from "mongoose";

const paymentSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
    },
    upiId: {
      type: String,
      trim: true,
      default: "",
    },
    payeeName: {
      type: String,
      trim: true,
      default: "",
    },
    qrImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    instructions: {
      type: String,
      trim: true,
      default: "",
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "PaymentSettings",
  paymentSettingsSchema
);
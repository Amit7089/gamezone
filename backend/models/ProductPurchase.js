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

    status: {
      type: String,
      enum: ["purchased", "cancelled"],
      default: "purchased",
    },

    requestId: {
      type: String,
      required: true,
    },

    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

productPurchaseSchema.index(
  { user: 1, requestId: 1 },
  { unique: true }
);

productPurchaseSchema.index({
  user: 1,
  purchasedAt: -1,
});

export default mongoose.models.ProductPurchase ||
  mongoose.model("ProductPurchase", productPurchaseSchema);
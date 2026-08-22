import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    page: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    description: { type: String, maxlength: 160, default: "" },
    checkoutUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    isEnabled: { type: Boolean, default: true },
    schedule: {
      mode: { type: String, enum: ["none", "schedule", "expiration"], default: "none" },
      startAt: { type: Date, default: null },
      endAt: { type: Date, default: null },
      expireAfter: {
        type: String,
        enum: ["1d", "3d", "7d", "30d", "custom"],
        default: null,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);

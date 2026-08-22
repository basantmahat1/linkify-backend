import mongoose from "mongoose";

const clickEventSchema = new mongoose.Schema(
  {
    page: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    link: { type: mongoose.Schema.Types.ObjectId, ref: "Link", default: null, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null, index: true },
    type: { type: String, enum: ["view", "click"], required: true, index: true },
    country: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    referrer: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

clickEventSchema.index({ page: 1, createdAt: -1 });

export default mongoose.model("ClickEvent", clickEventSchema);

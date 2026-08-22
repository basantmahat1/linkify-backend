import mongoose from "mongoose";

const CATEGORIES = ["organic", "abstract", "botanical", "flowers", "leaves", "stars", "sparkles", "waves", "doodles", "frames", "geometric", "neon", "luxury", "nature", "minimal", "custom"];

const decorationAssetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: String, enum: CATEGORIES, default: "custom" },
    type: { type: String, enum: ["svg", "png", "webp"], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    defaultWidth: { type: Number, default: 120 },
    defaultHeight: { type: Number, default: 120 },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

decorationAssetSchema.index({ category: 1, isActive: 1 });

export default mongoose.model("DecorationAsset", decorationAssetSchema);
export { CATEGORIES };

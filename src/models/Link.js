import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    page: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 25 },
    url: { type: String, required: true, trim: true },
    icon: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    description: { type: String, maxlength: 160, default: "" },
    order: { type: Number, default: 0, index: true },
    isEnabled: { type: Boolean, default: true },
    openInNewTab: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 },
    isSuspicious: { type: Boolean, default: false },
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
    protection: {
      passwordHash: { type: String, default: null },
      requireEmail: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

linkSchema.index({ page: 1, order: 1 });

export default mongoose.model("Link", linkSchema);

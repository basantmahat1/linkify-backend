import mongoose from "mongoose";

const socialLinksSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    x: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SocialLinks = mongoose.model("SocialLinks", socialLinksSchema);

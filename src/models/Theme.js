import mongoose from "mongoose";

const CATEGORIES = [
  "soft-coral",
  "sage-garden",
  "sunset-pop",
  "teal-studio",
  "editorial",
  "midnight",
  "candy",
  "earth",
  "monochrome",
  "playground",
  "luxury",
  "ocean",
  "custom",
];

const themeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]{3,60}$/, index: true },
    description: { type: String, default: "", maxlength: 300 },
    category: { type: String, enum: CATEGORIES, default: "custom" },
    thumbnail: { type: String, default: "" },

    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    isPremium: { type: Boolean, default: false },

    // Editable working copy — safe to change freely, never served to visitors.
    config: { type: mongoose.Schema.Types.Mixed, required: true },

    // Last published snapshot — this, and only this, is what public pages render.
    // Editing `config` never touches this, so live pages never break mid-edit.
    publishedConfig: { type: mongoose.Schema.Types.Mixed, default: null },
    version: { type: Number, default: 0 }, // bumped on every publish
    publishedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

themeSchema.index({ status: 1, category: 1 });

export default mongoose.model("Theme", themeSchema);
export { CATEGORIES };

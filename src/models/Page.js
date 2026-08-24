import mongoose from "mongoose";

const themeSchema = new mongoose.Schema(
  {
    background: {
      // "solid" | "gradient" | "blur" | "pattern" | "image" | "video" — the wallpaper style.
      type: { type: String, enum: ["solid", "gradient", "blur", "pattern", "image", "video"], default: "solid" },
      value: { type: String, default: "#FBEFE4" }, // base/solid color, also the blur-mode base color
      gradientFrom: { type: String, default: "#FDEDE3" },
      gradientTo: { type: String, default: "#F6EEE4" },
      gradientAngle: { type: Number, default: 135 },
      patternId: { type: String, default: "dots" }, // key into the frontend pattern preset library
      imageUrl: { type: String, default: "" },
      videoUrl: { type: String, default: "" },
      // Wallpaper effect applied on top of an image/video/pattern background.
      effect: { type: String, enum: ["none", "mono", "blur", "halftone", "vintage", "pixelate", "glow"], default: "none" },
      // -1 (dark overlay) .. 1 (light overlay), 0 = no tint. Improves text legibility.
      tint: { type: Number, default: 0, min: -1, max: 1 },
      noise: { type: Boolean, default: false }, // subtle grain texture overlay
    },
    buttonStyle: { type: String, enum: ["rounded", "square", "outline", "shadow", "glass", "minimal", "solid", "soft", "neon", "retro", "wavy", "torn", "pill"], default: "rounded" },
    buttonRadius: { type: Number, default: 8 },
    buttonShadow: { type: String, enum: ["none", "soft", "strong", "hard"], default: "none" },
    font: { type: String, default: "Inter" },
    colors: {
      text: { type: String, default: "#2F2A26" },
      title: { type: String, default: "" },
      button: { type: String, default: "#E8734A" },
      buttonText: { type: String, default: "#FFFFFF" },
    },
    layout: { type: String, enum: ["classic", "grid", "cards", "big", "minimal"], default: "classic" },
    // Profile header presentation — how the avatar/title/bio block is composed.
    profileLayout: {
      type: String,
      enum: ["classic", "hero", "banner", "cutout", "shape", "professional", "portrait"],
      default: "classic",
    },
    // Used for avatar clip in shape / classic / banner / professional / portrait.
    profileShape: {
      type: String,
      enum: ["loop", "flower", "oval", "rounded", "burst", "circle", "squircle"],
      default: "loop",
    },
    fonts: {
      page: { type: String, default: "" },
      title: { type: String, default: "" },
    },
    stickers: { type: Array, default: [] },
    footerText: { type: String, default: "" },
    appliedThemeId: { type: String, default: "" },
    productCard: {
      style: { type: String, enum: ["adaptive", "solid", "glass", "outline", "soft", "minimal"], default: "adaptive" },
      layout: { type: String, enum: ["grid", "list"], default: "grid" },
      radius: { type: Number, default: 16 },
      cardBg: { type: String, default: "" },
      cardText: { type: String, default: "" },
      priceColor: { type: String, default: "" },
      priceBg: { type: String, default: "" },
    },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_.-]{3,30}$/ },
    displayName: { type: String, maxlength: 25, default: "" },
    bio: { type: String, maxlength: 160, default: "" },
    avatarUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    theme: { type: themeSchema, default: () => ({}) },
    socials: {
      type: [
        {
          platform: {
            type: String,
            enum: ["instagram", "tiktok", "youtube", "facebook", "x", "linkedin", "github", "pinterest", "spotify", "discord", "telegram", "whatsapp", "email"],
            required: true,
          },
          url: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
    // Optional: when set, the public page renders via ThemeRenderer using this
    // theme's publishedConfig instead of the legacy `theme` object above.
    // Legacy `theme` is kept untouched so pages that never adopt a Theme Builder
    // theme keep working exactly as before.
    themeId: { type: mongoose.Schema.Types.ObjectId, ref: "Theme", default: null },
    isPublished: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String, default: "" },
    reportCount: { type: Number, default: 0 },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      ogImage: { type: String, default: "" },
      indexable: { type: Boolean, default: true },
    },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pageSchema.index({ username: 1 }, { unique: true });

export default mongoose.model("Page", pageSchema);

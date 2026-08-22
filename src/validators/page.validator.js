import { z } from "zod";

const clampStr = (max) =>
  z.preprocess((v) => {
    if (v === null || v === undefined) return undefined;
    return String(v).slice(0, max);
  }, z.string().max(max).optional());

/** Any string URL-ish path (absolute https or relative /uploads/...) */
const looseUrl = z.preprocess(
  (v) => (v === null || v === undefined ? undefined : String(v)),
  z.string().max(2000).optional()
);

const profileLayoutSchema = z.preprocess((v) => {
  if (v === "card" || v === "split") return "professional";
  return v;
}, z.enum(["classic", "hero", "banner", "cutout", "shape", "professional", "portrait"]).optional());

/**
 * Design page sends partial patches frequently.
 * Keep this permissive so theme editor never 422s on extra keys / shapes.
 */
export const updatePageSchema = z.object({
  body: z
    .object({
      displayName: clampStr(25),
      bio: clampStr(160),
      avatarUrl: looseUrl,
      bannerUrl: looseUrl,
      coverUrl: looseUrl,
      isPublished: z.boolean().optional(),
      themeId: z
        .preprocess((v) => {
          if (v && typeof v === "object" && v._id) return String(v._id);
          if (v === null) return null;
          if (v === undefined || v === "") return undefined;
          return String(v);
        }, z.string().nullable().optional()),
      socials: z.array(z.any()).max(20).optional(),
      theme: z.any().optional(),
      seo: z.any().optional(),
    })
    .passthrough(),
});

/** Normalize theme.profileLayout after Zod (optional helper for controller) */
export function normalizeThemePatch(theme) {
  if (!theme || typeof theme !== "object") return theme;
  const next = { ...theme };

  if (next.profileLayout === "card" || next.profileLayout === "split") {
    next.profileLayout = "professional";
  }

  const allowedLayouts = new Set([
    "classic",
    "hero",
    "banner",
    "cutout",
    "shape",
    "professional",
    "portrait",
  ]);
  if (next.profileLayout && !allowedLayouts.has(next.profileLayout)) {
    next.profileLayout = "classic";
  }

  const allowedShapes = new Set([
    "loop",
    "flower",
    "oval",
    "rounded",
    "burst",
    "circle",
    "squircle",
  ]);
  if (next.profileShape && !allowedShapes.has(next.profileShape)) {
    next.profileShape = "circle";
  }

  const allowedButtonStyles = new Set([
    "rounded",
    "square",
    "outline",
    "shadow",
    "glass",
    "minimal",
    "solid",
    "soft",
    "neon",
    "retro",
    "wavy",
    "torn",
    "pill",
  ]);
  if (next.buttonStyle && !allowedButtonStyles.has(next.buttonStyle)) {
    next.buttonStyle = "rounded";
  }

  const allowedShadows = new Set(["none", "soft", "strong", "hard"]);
  if (next.buttonShadow === "" || next.buttonShadow === null || next.buttonShadow === undefined) {
    next.buttonShadow = "none";
  } else if (!allowedShadows.has(next.buttonShadow)) {
    next.buttonShadow = "none";
  }

  // Avoid casting issues — keep plain nested objects only
  if (next.fonts && typeof next.fonts !== "object") delete next.fonts;
  if (next.background && typeof next.background === "object") {
    const bg = { ...next.background };
    const bgTypes = new Set(["solid", "gradient", "blur", "pattern", "image", "video"]);
    if (bg.type && !bgTypes.has(bg.type)) bg.type = "solid";
    const effects = new Set(["none", "mono", "blur", "halftone", "vintage", "pixelate", "glow"]);
    if (bg.effect && !effects.has(bg.effect)) bg.effect = "none";
    next.background = bg;
  }

  return next;
}

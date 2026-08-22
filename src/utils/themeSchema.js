/**
 * Theme JSON schema v2 — free-form canvas model.
 *
 * Every element carries its own absolute x/y/width/height/rotation/scale/zIndex,
 * exactly like a Canva/Figma frame. The canvas itself is a fixed design-coordinate
 * space (canvas.width × canvas.minHeight); the renderer scales the whole frame to
 * fit its container rather than reflowing content — so the design never breaks on
 * different screens, and the editor and public page always agree pixel-for-pixel.
 *
 * This file is the single source of truth for what's allowed in a theme. It is
 * used on every admin save (sanitize: strip/clamp anything invalid) and, more
 * strictly, at publish time (validate: reject instead of silently stripping).
 */

export const ELEMENT_TYPES = [
  "profile",
  "text",
  "image",
  "button",
  "socials",
  "links",
  "video",
  "divider",
  "spacer",
  "card",
  "gallery",
  "icon",
  "countdown",
  "embed",
  "html",
  "shape",
  "decoration",
  "pattern",
  "illustration",
];

export const FONT_WHITELIST = [
  "Inter",
  "Fraunces",
  "Poppins",
  "Playfair Display",
  "Space Grotesk",
  "DM Serif Display",
  "Manrope",
  "Cormorant Garamond",
];

export const BUTTON_VARIANTS = ["solid", "outline", "ghost", "glass", "gradient", "soft", "minimal", "custom"];
export const LINK_VARIANTS = ["outline", "filled", "soft", "glass", "card", "pill", "minimal", "compact"];
export const SOCIAL_ICON_STYLES = ["circle", "square", "outline", "filled"];
export const SHAPE_KINDS = ["rectangle", "rounded-rectangle", "circle", "ellipse", "triangle", "line", "blob", "polygon"];
export const PROFILE_SHAPES = ["circle", "rounded", "square"];
export const BG_TYPES = ["solid", "gradient", "image", "pattern"];
export const GRADIENT_TYPES = ["linear", "radial", "conic"];
export const OBJECT_FITS = ["cover", "contain", "fill"];
export const EMBED_HOSTS = ["youtube.com", "www.youtube.com", "youtu.be", "vimeo.com", "open.spotify.com"];

const MAX_ELEMENTS = 120;
const CANVAS_MAX_H = 6000;

// ---- primitives -------------------------------------------------------

const isColor = (v) => typeof v === "string" && /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|transparent)$/.test(v.trim());
const isNum = (v, min = -100000, max = 100000) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const clampNum = (v, min, max, fallback) => (isNum(v, min, max) ? v : fallback);
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);
const stripHtml = (v, max = 500) => (typeof v === "string" ? v.replace(/<[^>]*>/g, "").slice(0, max) : "");
const isSafeUrl = (v) =>
  typeof v === "string" && (v === "" || /^https?:\/\/[^\s"'<>]+$/i.test(v) || /^\/(uploads|assets)\/[^\s"'<>]+$/.test(v));
const isEmbedUrl = (v) => {
  if (!isSafeUrl(v) || !v) return false;
  try {
    const { hostname } = new URL(v);
    return EMBED_HOSTS.includes(hostname);
  } catch {
    return false;
  }
};

// Strict allowlist sanitizer for the "html" element — used only for short
// admin-authored rich text blocks, never for arbitrary script execution.
function sanitizeInlineHtml(raw) {
  if (typeof raw !== "string") return "";
  let s = raw.slice(0, 4000);
  s = s.replace(/<\/?(script|style|iframe|object|embed|link|meta|base|form)[^>]*>/gi, "");
  s = s.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ""); // strip event handlers
  s = s.replace(/javascript\s*:/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  return s;
}

function sanitizeGradient(g) {
  if (!g || typeof g !== "object") return null;
  const stops = Array.isArray(g.stops)
    ? g.stops
        .slice(0, 6)
        .map((s) => ({ color: isColor(s?.color) ? s.color : "#000000", position: clampNum(s?.position, 0, 100, 0) }))
    : [];
  if (stops.length < 2) return null;
  return {
    gradientType: oneOf(g.gradientType, GRADIENT_TYPES, "linear"),
    angle: clampNum(g.angle, 0, 360, 135),
    stops,
  };
}

function sanitizeBackground(bg) {
  const b = bg && typeof bg === "object" ? bg : {};
  const type = oneOf(b.type, BG_TYPES, "solid");
  const out = { type };
  if (type === "solid") {
    out.value = isColor(b.value) ? b.value : "#F8F0E8";
  } else if (type === "gradient") {
    out.gradient = sanitizeGradient(b.gradient) || { gradientType: "linear", angle: 135, stops: [{ color: "#FDEDE3", position: 0 }, { color: "#F6EEE4", position: 100 }] };
  } else if (type === "image") {
    out.image = {
      url: isSafeUrl(b.image?.url) ? b.image.url : "",
      opacity: clampNum(b.image?.opacity, 0, 1, 1),
      blur: clampNum(b.image?.blur, 0, 20, 0),
      objectFit: oneOf(b.image?.objectFit, OBJECT_FITS, "cover"),
    };
  } else if (type === "pattern") {
    out.pattern = {
      url: isSafeUrl(b.pattern?.url) ? b.pattern.url : "",
      repeat: b.pattern?.repeat !== false,
      size: clampNum(b.pattern?.size, 8, 400, 64),
      opacity: clampNum(b.pattern?.opacity, 0, 1, 0.5),
    };
  }
  return out;
}

// ---- per-type props/styles ---------------------------------------------

function sanitizeProps(type, props = {}) {
  const p = props && typeof props === "object" ? props : {};
  switch (type) {
    case "text":
      return { content: stripHtml(p.content ?? "Edit this text", 500), binding: oneOf(p.binding, ["none", "displayName", "bio", "username"], "none") };
    case "image":
      return { url: isSafeUrl(p.url) ? p.url : "", alt: stripHtml(p.alt ?? "", 150) };
    case "button":
      return {
        label: stripHtml(p.label ?? "Click me", 60),
        icon: stripHtml(p.icon ?? "", 30),
        iconPosition: oneOf(p.iconPosition, ["left", "right"], "left"),
        url: isSafeUrl(p.url) ? p.url : "",
      };
    case "video":
      return { url: isEmbedUrl(p.url) ? p.url : "" };
    case "embed":
      return { url: isEmbedUrl(p.url) ? p.url : "" };
    case "card":
      return { title: stripHtml(p.title ?? "Title", 80), body: stripHtml(p.body ?? "", 300) };
    case "gallery":
      return { images: Array.isArray(p.images) ? p.images.filter(isSafeUrl).slice(0, 12) : [] };
    case "icon":
      return { name: stripHtml(p.name ?? "star", 30) };
    case "countdown":
      return { targetDate: typeof p.targetDate === "string" ? p.targetDate.slice(0, 40) : "", label: stripHtml(p.label ?? "", 60) };
    case "html":
      return { content: sanitizeInlineHtml(p.content ?? "") };
    case "decoration":
    case "pattern":
    case "illustration":
      return { assetId: typeof p.assetId === "string" ? p.assetId.slice(0, 60) : "", url: isSafeUrl(p.url) ? p.url : "" };
    default:
      return {};
  }
}

function sanitizeStyles(type, styles = {}) {
  const s = styles && typeof styles === "object" ? styles : {};
  const out = {};
  switch (type) {
    case "profile":
      out.shape = oneOf(s.shape, PROFILE_SHAPES, "circle");
      out.radius = clampNum(s.radius, 0, 200, 999);
      out.border = clampNum(s.border, 0, 12, 0);
      out.borderColor = isColor(s.borderColor) ? s.borderColor : "#ffffff";
      out.shadow = !!s.shadow;
      out.objectFit = oneOf(s.objectFit, OBJECT_FITS, "cover");
      break;
    case "text":
      out.fontFamily = oneOf(s.fontFamily, FONT_WHITELIST, "Inter");
      out.fontSize = clampNum(s.fontSize, 8, 96, 16);
      out.fontWeight = oneOf(s.fontWeight, ["400", "500", "600", "700", "800"], "400");
      out.fontStyle = oneOf(s.fontStyle, ["normal", "italic"], "normal");
      out.color = isColor(s.color) ? s.color : "#222222";
      out.gradient = s.gradient?.enabled
        ? { enabled: true, from: isColor(s.gradient.from) ? s.gradient.from : "#F2825E", to: isColor(s.gradient.to) ? s.gradient.to : "#5B8DEF", angle: clampNum(s.gradient.angle, 0, 360, 90) }
        : { enabled: false };
      out.align = oneOf(s.align, ["left", "center", "right"], "center");
      out.lineHeight = clampNum(s.lineHeight, 0.9, 2.4, 1.4);
      out.letterSpacing = clampNum(s.letterSpacing, -2, 10, 0);
      out.textTransform = oneOf(s.textTransform, ["none", "uppercase", "capitalize"], "none");
      out.textShadow = !!s.textShadow;
      break;
    case "image":
      out.objectFit = oneOf(s.objectFit, OBJECT_FITS, "cover");
      out.objectPosition = oneOf(s.objectPosition, ["center", "top", "bottom", "left", "right"], "center");
      out.radius = clampNum(s.radius, 0, 300, 12);
      out.border = clampNum(s.border, 0, 12, 0);
      out.borderColor = isColor(s.borderColor) ? s.borderColor : "#ffffff";
      out.shadow = !!s.shadow;
      break;
    case "button":
      out.variant = oneOf(s.variant, BUTTON_VARIANTS, "solid");
      out.background = isColor(s.background) ? s.background : "#222222";
      out.gradientFrom = isColor(s.gradientFrom) ? s.gradientFrom : "#F2825E";
      out.gradientTo = isColor(s.gradientTo) ? s.gradientTo : "#FF6FA5";
      out.textColor = isColor(s.textColor) ? s.textColor : "#ffffff";
      out.border = clampNum(s.border, 0, 6, 0);
      out.borderColor = isColor(s.borderColor) ? s.borderColor : "#222222";
      out.radius = clampNum(s.radius, 0, 999, 12);
      out.shadow = !!s.shadow;
      out.fontSize = clampNum(s.fontSize, 10, 32, 15);
      out.fontWeight = oneOf(s.fontWeight, ["400", "500", "600", "700"], "600");
      out.align = oneOf(s.align, ["left", "center", "right"], "center");
      break;
    case "socials":
      out.iconStyle = oneOf(s.iconStyle, SOCIAL_ICON_STYLES, "circle");
      out.background = isColor(s.background) ? s.background : "transparent";
      out.color = isColor(s.color) ? s.color : "#222222";
      out.size = clampNum(s.size, 12, 48, 18);
      out.gap = clampNum(s.gap, 0, 40, 14);
      out.align = oneOf(s.align, ["left", "center", "right"], "center");
      break;
    case "links":
      out.variant = oneOf(s.variant, LINK_VARIANTS, "outline");
      out.radius = clampNum(s.radius, 0, 48, 14);
      out.gap = clampNum(s.gap, 0, 32, 12);
      out.background = isColor(s.background) ? s.background : "#ffffff";
      out.textColor = isColor(s.textColor) ? s.textColor : "#222222";
      out.borderColor = isColor(s.borderColor) ? s.borderColor : "#222222";
      out.borderWidth = clampNum(s.borderWidth, 0, 6, 1);
      out.shadow = !!s.shadow;
      out.itemHeight = clampNum(s.itemHeight, 32, 100, 52);
      out.textAlign = oneOf(s.textAlign, ["center", "left"], "center");
      out.fontWeight = oneOf(s.fontWeight, ["400", "500", "600", "700"], "600");
      break;
    case "video":
    case "embed":
      out.radius = clampNum(s.radius, 0, 40, 12);
      out.shadow = !!s.shadow;
      break;
    case "divider":
      out.color = isColor(s.color) ? s.color : "#00000022";
      out.thickness = clampNum(s.thickness, 1, 8, 1);
      break;
    case "card":
      out.background = isColor(s.background) ? s.background : "#ffffff";
      out.radius = clampNum(s.radius, 0, 48, 16);
      out.border = clampNum(s.border, 0, 6, 0);
      out.borderColor = isColor(s.borderColor) ? s.borderColor : "#00000022";
      out.shadow = !!s.shadow;
      out.textColor = isColor(s.textColor) ? s.textColor : "#222222";
      break;
    case "gallery":
      out.radius = clampNum(s.radius, 0, 40, 10);
      out.gap = clampNum(s.gap, 0, 24, 8);
      out.columns = clampNum(s.columns, 1, 4, 2);
      break;
    case "icon":
      out.color = isColor(s.color) ? s.color : "#222222";
      out.background = isColor(s.background) ? s.background : "transparent";
      out.size = clampNum(s.size, 12, 80, 24);
      out.radius = clampNum(s.radius, 0, 999, 8);
      break;
    case "countdown":
      out.color = isColor(s.color) ? s.color : "#222222";
      out.background = isColor(s.background) ? s.background : "transparent";
      out.fontSize = clampNum(s.fontSize, 10, 48, 20);
      break;
    case "shape":
      out.kind = oneOf(s.kind, SHAPE_KINDS, "circle");
      out.fill = isColor(s.fill) ? s.fill : "#F2825E";
      out.border = clampNum(s.border, 0, 12, 0);
      out.borderColor = isColor(s.borderColor) ? s.borderColor : "#000000";
      out.radius = clampNum(s.radius, 0, 200, 0);
      out.shadow = !!s.shadow;
      break;
    case "decoration":
    case "pattern":
    case "illustration":
      out.blur = clampNum(s.blur, 0, 20, 0);
      out.brightness = clampNum(s.brightness, 0.3, 2, 1);
      out.contrast = clampNum(s.contrast, 0.3, 2, 1);
      out.grayscale = !!s.grayscale;
      break;
    default:
      break;
  }
  return out;
}

function sanitizeElement(raw, index) {
  if (!raw || typeof raw !== "object") return null;
  const type = ELEMENT_TYPES.includes(raw.type) ? raw.type : null;
  if (!type) return null;

  return {
    id: typeof raw.id === "string" && raw.id.length <= 60 ? raw.id : `el_${index}_${Date.now()}`,
    type,
    name: typeof raw.name === "string" ? raw.name.slice(0, 40) : "",
    x: clampNum(raw.x, -2000, 6000, 20),
    y: clampNum(raw.y, -2000, CANVAS_MAX_H, 20),
    width: isNum(raw.width, 4, 4000) ? raw.width : 120,
    height: raw.height === "auto" ? "auto" : isNum(raw.height, 4, 4000) ? raw.height : 40,
    rotation: clampNum(raw.rotation, -360, 360, 0),
    scaleX: clampNum(raw.scaleX, -3, 3, 1) || 1,
    scaleY: clampNum(raw.scaleY, -3, 3, 1) || 1,
    zIndex: clampNum(raw.zIndex, 0, 10000, index + 1),
    locked: !!raw.locked,
    visible: raw.visible !== false,
    opacity: clampNum(raw.opacity, 0, 1, 1),
    responsive: { mobile: { visible: raw.responsive?.mobile?.visible !== false } },
    props: sanitizeProps(type, raw.props),
    styles: sanitizeStyles(type, raw.styles),
  };
}

/** Sanitize a full theme config. Always returns a clean object — used for draft saves. */
export function sanitizeThemeConfig(input) {
  const cfg = input && typeof input === "object" ? input : {};

  const canvas = {
    width: clampNum(cfg.canvas?.width, 280, 720, 390),
    minHeight: clampNum(cfg.canvas?.minHeight, 400, CANVAS_MAX_H, 844),
    background: sanitizeBackground(cfg.canvas?.background),
  };

  const globalStyles = {
    fontFamily: oneOf(cfg.globalStyles?.fontFamily, FONT_WHITELIST, "Inter"),
    headingFont: oneOf(cfg.globalStyles?.headingFont, FONT_WHITELIST, oneOf(cfg.globalStyles?.fontFamily, FONT_WHITELIST, "Inter")),
    textColor: isColor(cfg.globalStyles?.textColor) ? cfg.globalStyles.textColor : "#222222",
    primaryColor: isColor(cfg.globalStyles?.primaryColor) ? cfg.globalStyles.primaryColor : "#F2825E",
    radius: clampNum(cfg.globalStyles?.radius, 0, 48, 16),
  };

  const rawElements = Array.isArray(cfg.elements) ? cfg.elements.slice(0, MAX_ELEMENTS) : [];
  const elements = rawElements.map(sanitizeElement).filter(Boolean);

  return { version: 2, canvas, globalStyles, elements };
}

/** Strict pass used only at publish time. Returns { valid, errors }. */
export function validateForPublish(config) {
  const errors = [];
  if (!config || typeof config !== "object") return { valid: false, errors: ["Config is missing"] };
  if (!Array.isArray(config.elements) || config.elements.length === 0) errors.push("Theme must contain at least one element");
  if (Array.isArray(config.elements) && config.elements.length > MAX_ELEMENTS) errors.push(`Theme exceeds the maximum of ${MAX_ELEMENTS} elements`);

  const hasProfile = Array.isArray(config.elements) && config.elements.some((e) => e.type === "profile" && e.visible);
  if (!hasProfile) errors.push("Theme must include a visible profile element");

  const seenIds = new Set();
  for (const el of config.elements || []) {
    if (!ELEMENT_TYPES.includes(el.type)) errors.push(`Unknown element type: ${el.type}`);
    if (seenIds.has(el.id)) errors.push(`Duplicate element id: ${el.id}`);
    seenIds.add(el.id);
    if (!isNum(el.x) || !isNum(el.y) || !isNum(el.width)) errors.push(`Invalid position/size on element ${el.id}`);
    if (["image"].includes(el.type) && el.props?.url && !isSafeUrl(el.props.url)) errors.push(`Unsafe image URL on element ${el.id}`);
    if (["decoration", "pattern", "illustration"].includes(el.type) && el.props?.url && !isSafeUrl(el.props.url)) errors.push(`Unsafe decoration URL on element ${el.id}`);
    if (["video", "embed"].includes(el.type) && el.props?.url && !isEmbedUrl(el.props.url)) errors.push(`Unsafe/unsupported embed URL on element ${el.id}`);
  }

  return { valid: errors.length === 0, errors };
}

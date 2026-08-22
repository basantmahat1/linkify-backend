import { sanitizeThemeConfig } from "../src/utils/themeSchema.js";

let n = 0;
const uid = (t) => `${t}_${(n++).toString(36)}`;

/** Stacks content elements top-to-bottom on a fixed-width column, computing y automatically. */
function stack(specs, { startX = 30, width = 330, startY = 64, gap = 18, startZ = 10 } = {}) {
  let y = startY;
  let z = startZ;
  return specs.map((spec) => {
    const height = spec.height === "auto" ? "auto" : spec.height ?? 60;
    const el = {
      id: uid(spec.type),
      type: spec.type,
      name: spec.name || "",
      x: spec.x ?? startX,
      y,
      width: spec.width ?? width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: z++,
      locked: false,
      visible: true,
      opacity: 1,
      responsive: { mobile: { visible: true } },
      props: spec.props || {},
      styles: spec.styles || {},
    };
    y += (height === "auto" ? spec.estHeight ?? 40 : height) + (spec.gap ?? gap);
    return el;
  });
}

function deco(type, x, y, w, h, { props = {}, styles = {}, rotation = 0, zIndex = 1, name = "" } = {}) {
  return {
    id: uid(type),
    type,
    name,
    x,
    y,
    width: w,
    height: h,
    rotation,
    scaleX: 1,
    scaleY: 1,
    zIndex,
    locked: false,
    visible: true,
    opacity: 1,
    responsive: { mobile: { visible: true } },
    props,
    styles,
  };
}

const nameText = (styles) => ({ type: "text", name: "Name", width: 330, height: "auto", estHeight: 30, props: { binding: "displayName" }, styles: { fontSize: 22, fontWeight: "700", align: "center", ...styles } });
const bioText = (styles) => ({ type: "text", name: "Bio", width: 300, height: "auto", estHeight: 40, x: 45, props: { binding: "bio" }, styles: { fontSize: 14, fontWeight: "400", align: "center", ...styles } });

function theme({ name, slug, category, description, canvasBg, globalStyles, elements }) {
  return {
    name,
    slug,
    category,
    description,
    thumbnail: "",
    config: sanitizeThemeConfig({
      canvas: { width: 390, minHeight: 920, background: canvasBg },
      globalStyles,
      elements,
    }),
  };
}

export const THEME_DEFINITIONS = [
  theme({
    name: "Soft Coral",
    slug: "soft-coral",
    category: "soft-coral",
    description: "Centered profile with a warm coral accent and gentle corner blobs.",
    canvasBg: { type: "solid", value: "#FFF7F6" },
    globalStyles: { fontFamily: "Inter", textColor: "#1C1B1F", primaryColor: "#EF4056", radius: 18 },
    elements: [
      deco("shape", -50, -50, 220, 220, { styles: { kind: "blob", fill: "#EF4056" }, rotation: -10, zIndex: 1 }),
      deco("shape", 260, 640, 200, 200, { styles: { kind: "blob", fill: "#EF4056" }, rotation: 20, zIndex: 1 }),
      ...stack(
        [
          { type: "profile", x: 135, width: 120, height: 120, gap: 16, styles: { shape: "circle", shadow: true } },
          nameText(),
          bioText(),
          { type: "socials", height: 40, gap: 20, styles: { iconStyle: "circle", align: "center", color: "#EF4056" } },
          { type: "links", height: 190, styles: { variant: "outline", radius: 999, borderColor: "#EF4056", textColor: "#1C1B1F", itemHeight: 54 } },
        ],
        { startY: 60 }
      ),
    ],
  }),

  theme({
    name: "Sage Garden",
    slug: "sage-garden",
    category: "sage-garden",
    description: "Botanical decoration, organic spacing, warm cream backdrop.",
    canvasBg: { type: "solid", value: "#F6F1E5" },
    globalStyles: { fontFamily: "Fraunces", headingFont: "Fraunces", textColor: "#3B4636", primaryColor: "#7C9070", radius: 20 },
    elements: [
      deco("shape", -60, -20, 200, 240, { styles: { kind: "blob", fill: "#8CA37E" }, rotation: -18, zIndex: 1 }),
      deco("shape", 260, 700, 180, 190, { styles: { kind: "blob", fill: "#B7C4A0" }, rotation: 12, zIndex: 1 }),
      ...stack(
        [
          { type: "profile", x: 130, width: 130, height: 130, gap: 18, styles: { shape: "rounded", border: 3, borderColor: "#F6F1E5", shadow: true } },
          nameText({ fontFamily: "Fraunces" }),
          bioText(),
          { type: "socials", height: 40, gap: 22, styles: { iconStyle: "outline", align: "center", color: "#7C9070" } },
          { type: "links", height: 210, styles: { variant: "soft", radius: 22, background: "#EAEEDF", textColor: "#3B4636", itemHeight: 56 } },
        ],
        { startY: 66 }
      ),
    ],
  }),

  theme({
    name: "Sunset Pop",
    slug: "sunset-pop",
    category: "sunset-pop",
    description: "Orange-to-pink gradient with bold buttons and energetic spacing.",
    canvasBg: { type: "gradient", gradient: { gradientType: "linear", angle: 160, stops: [{ color: "#FF9A6C", position: 0 }, { color: "#FF6FA5", position: 55 }, { color: "#FFB35C", position: 100 }] } },
    globalStyles: { fontFamily: "Space Grotesk", textColor: "#3A1220", primaryColor: "#FFFFFF", radius: 24 },
    elements: [
      deco("shape", 260, -30, 130, 130, { styles: { kind: "circle", fill: "#FFFFFF" }, zIndex: 1 }),
      deco("shape", -40, 640, 110, 110, { styles: { kind: "circle", fill: "#FFFFFF" }, zIndex: 1 }),
      ...stack(
        [
          { type: "profile", x: 125, width: 140, height: 140, gap: 18, styles: { shape: "circle", border: 4, borderColor: "#FFFFFF", shadow: true } },
          nameText({ fontWeight: "800", fontSize: 26, color: "#3A1220" }),
          bioText({ color: "#3A1220" }),
          { type: "socials", height: 44, gap: 12, styles: { iconStyle: "filled", align: "center", color: "#3A1220", background: "#FFFFFF" } },
          { type: "links", height: 210, styles: { variant: "filled", radius: 999, background: "#FFFFFF", textColor: "#3A1220", shadow: true, itemHeight: 58 } },
        ],
        { startY: 58 }
      ),
    ],
  }),

  theme({
    name: "Teal Studio",
    slug: "teal-studio",
    category: "teal-studio",
    description: "Professional dark teal with filled cards for a business-focused layout.",
    canvasBg: { type: "solid", value: "#0F3B3B" },
    globalStyles: { fontFamily: "Manrope", textColor: "#EAF5F2", primaryColor: "#5FBFAE", radius: 12 },
    elements: stack(
      [
        { type: "profile", x: 30, width: 76, height: 76, gap: 14, styles: { shape: "rounded" } },
        { type: "text", name: "Name", x: 118, width: 240, height: "auto", estHeight: 28, gap: 4, props: { binding: "displayName" }, styles: { fontSize: 20, fontWeight: "700", align: "left" } },
        { type: "text", name: "Bio", x: 118, width: 240, height: "auto", estHeight: 34, gap: 16, props: { binding: "bio" }, styles: { fontSize: 13, align: "left" } },
        { type: "divider", height: 1, gap: 18, styles: { color: "#5FBFAE44" } },
        { type: "links", height: 220, gap: 16, styles: { variant: "filled", radius: 10, background: "#154E4E", textColor: "#EAF5F2", textAlign: "left", itemHeight: 54 } },
        { type: "socials", height: 30, styles: { iconStyle: "square", align: "left", color: "#5FBFAE" } },
      ],
      { startY: 40 }
    ),
  }),

  theme({
    name: "Editorial",
    slug: "editorial",
    category: "editorial",
    description: "Typography-forward serif heading, thin borders, asymmetric spacing.",
    canvasBg: { type: "solid", value: "#FAF8F4" },
    globalStyles: { fontFamily: "Playfair Display", headingFont: "Playfair Display", textColor: "#1E1B18", primaryColor: "#1E1B18", radius: 2 },
    elements: stack(
      [
        { type: "profile", x: 30, width: 84, height: 84, gap: 14, styles: { shape: "square" } },
        { type: "text", name: "Name", width: 330, height: "auto", estHeight: 40, gap: 8, props: { binding: "displayName" }, styles: { fontSize: 28, fontWeight: "600", align: "left" } },
        { type: "divider", width: 60, height: 1, gap: 12, styles: { color: "#1E1B1833" } },
        { type: "text", name: "Bio", width: 330, height: "auto", estHeight: 40, gap: 20, props: { binding: "bio" }, styles: { fontSize: 14, align: "left" } },
        { type: "links", height: 200, gap: 4, styles: { variant: "minimal", radius: 0, borderColor: "#1E1B1833", textColor: "#1E1B18", textAlign: "left", itemHeight: 48 } },
        { type: "socials", height: 26, gap: 16, styles: { iconStyle: "outline", align: "left", color: "#1E1B18" } },
      ],
      { startY: 50 }
    ),
  }),

  theme({
    name: "Midnight",
    slug: "midnight",
    category: "midnight",
    description: "Dark background with premium minimal cards and subtle borders.",
    canvasBg: { type: "solid", value: "#121016" },
    globalStyles: { fontFamily: "Inter", textColor: "#F3F1F5", primaryColor: "#9C8CF0", radius: 16 },
    elements: stack(
      [
        { type: "profile", x: 147, width: 96, height: 96, gap: 16, styles: { shape: "circle", border: 1, borderColor: "#9C8CF055" } },
        nameText({ fontSize: 21 }),
        bioText(),
        { type: "socials", height: 36, gap: 18, styles: { iconStyle: "outline", align: "center", color: "#C9C2E0" } },
        { type: "links", height: 200, styles: { variant: "card", radius: 14, background: "#1D1A24", textColor: "#F3F1F5", borderColor: "#2C2836", borderWidth: 1, shadow: true, itemHeight: 54 } },
      ],
      { startY: 70 }
    ),
  }),

  theme({
    name: "Candy",
    slug: "candy",
    category: "candy",
    description: "Soft pink playground with rounded cards and blob decorations.",
    canvasBg: { type: "solid", value: "#FFE9F3" },
    globalStyles: { fontFamily: "Poppins", textColor: "#5A2A45", primaryColor: "#FF6FA5", radius: 26 },
    elements: [
      deco("shape", -40, 20, 120, 120, { styles: { kind: "blob", fill: "#FFB4D6" }, rotation: 8, zIndex: 1 }),
      deco("shape", 300, 20, 100, 100, { styles: { kind: "circle", fill: "#C6A6FF" }, zIndex: 1 }),
      ...stack(
        [
          { type: "profile", x: 129, width: 132, height: 132, gap: 18, styles: { shape: "circle", border: 5, borderColor: "#FFFFFF", shadow: true } },
          nameText({ fontSize: 24 }),
          bioText(),
          { type: "socials", height: 44, gap: 12, styles: { iconStyle: "filled", align: "center", color: "#FF6FA5", background: "#FFFFFF" } },
          { type: "links", height: 210, styles: { variant: "filled", radius: 999, background: "#FF6FA5", textColor: "#FFFFFF", shadow: true, itemHeight: 56 } },
        ],
        { startY: 170 }
      ),
    ],
  }),

  theme({
    name: "Earth",
    slug: "earth",
    category: "earth",
    description: "Olive and cream tones with organic shapes and grounded serif type.",
    canvasBg: { type: "solid", value: "#EFE9D8" },
    globalStyles: { fontFamily: "Cormorant Garamond", headingFont: "Cormorant Garamond", textColor: "#3E3626", primaryColor: "#8A7248", radius: 14 },
    elements: [
      deco("shape", -60, 660, 170, 170, { styles: { kind: "blob", fill: "#A99569" }, rotation: -6, zIndex: 1 }),
      ...stack(
        [
          { type: "profile", x: 145, width: 100, height: 100, gap: 16, styles: { shape: "rounded" } },
          nameText({ fontSize: 25 }),
          bioText({ fontSize: 15 }),
          { type: "socials", height: 36, gap: 20, styles: { iconStyle: "outline", align: "center", color: "#8A7248" } },
          { type: "links", height: 200, styles: { variant: "soft", radius: 12, background: "#E2D9BF", textColor: "#3E3626", itemHeight: 54 } },
        ],
        { startY: 64 }
      ),
    ],
  }),

  theme({
    name: "Monochrome",
    slug: "monochrome",
    category: "monochrome",
    description: "Strict black-and-white with minimal borders and disciplined spacing.",
    canvasBg: { type: "solid", value: "#FFFFFF" },
    globalStyles: { fontFamily: "Space Grotesk", textColor: "#0A0A0A", primaryColor: "#0A0A0A", radius: 0 },
    elements: stack(
      [
        { type: "profile", x: 150, width: 90, height: 90, gap: 14, styles: { shape: "square" } },
        nameText({ fontSize: 20, fontWeight: "700" }),
        { type: "divider", width: 24, height: 2, gap: 14, styles: { color: "#0A0A0A", thickness: 2 } },
        { type: "links", height: 190, gap: 8, styles: { variant: "outline", radius: 0, borderColor: "#0A0A0A", textColor: "#0A0A0A", itemHeight: 50 } },
        { type: "socials", height: 26, gap: 18, styles: { iconStyle: "outline", align: "center", color: "#0A0A0A" } },
      ],
      { startY: 70 }
    ),
  }),

  theme({
    name: "Playground",
    slug: "playground",
    category: "playground",
    description: "Colorful, abstract, and playful — bold shapes scattered around bold links.",
    canvasBg: { type: "gradient", gradient: { gradientType: "linear", angle: 135, stops: [{ color: "#FFE477", position: 0 }, { color: "#7CE0C6", position: 50 }, { color: "#8CA6FF", position: 100 }] } },
    globalStyles: { fontFamily: "Poppins", textColor: "#1F2430", primaryColor: "#FF6F61", radius: 22 },
    elements: [
      deco("shape", -30, -20, 90, 90, { styles: { kind: "circle", fill: "#FF6F61" }, zIndex: 1 }),
      deco("shape", 320, 10, 70, 70, { styles: { kind: "rectangle", fill: "#3A6FF7" }, rotation: 18, zIndex: 1 }),
      deco("shape", 320, 720, 100, 100, { styles: { kind: "blob", fill: "#FFD447" }, rotation: -12, zIndex: 1 }),
      deco("shape", -40, 700, 80, 80, { styles: { kind: "circle", fill: "#12B886" }, zIndex: 1 }),
      ...stack(
        [
          { type: "profile", x: 137, width: 116, height: 116, gap: 18, styles: { shape: "circle", border: 4, borderColor: "#FFFFFF", shadow: true } },
          nameText({ fontWeight: "800", fontSize: 24 }),
          bioText(),
          { type: "socials", height: 40, gap: 12, styles: { iconStyle: "circle", align: "center", color: "#1F2430", background: "#FFFFFF" } },
          { type: "links", height: 210, styles: { variant: "filled", radius: 999, background: "#1F2430", textColor: "#FFFFFF", shadow: true, itemHeight: 56 } },
        ],
        { startY: 60 }
      ),
    ],
  }),

  theme({
    name: "Luxury",
    slug: "luxury",
    category: "luxury",
    description: "Black and gold with elegant typography and premium spacing.",
    canvasBg: { type: "solid", value: "#0B0B0B" },
    globalStyles: { fontFamily: "Cormorant Garamond", headingFont: "DM Serif Display", textColor: "#EDE3C8", primaryColor: "#C9A227", radius: 4 },
    elements: [
      deco("divider", 115, 46, 160, 2, { styles: { color: "#C9A227", thickness: 1 } }),
      ...stack(
        [
          { type: "profile", x: 145, width: 100, height: 100, gap: 18, styles: { shape: "circle", border: 1, borderColor: "#C9A227" } },
          nameText({ fontSize: 26, fontWeight: "600" }),
          bioText(),
          { type: "socials", height: 30, gap: 24, styles: { iconStyle: "outline", align: "center", color: "#C9A227" } },
          { type: "links", height: 190, gap: 18, styles: { variant: "minimal", radius: 0, borderColor: "#C9A22766", textColor: "#EDE3C8", itemHeight: 46 } },
        ],
        { startY: 70 }
      ),
    ],
  }),

  theme({
    name: "Ocean",
    slug: "ocean",
    category: "ocean",
    description: "Teal and blue with a watercolor wave decoration and a calm hierarchy.",
    canvasBg: { type: "gradient", gradient: { gradientType: "linear", angle: 180, stops: [{ color: "#DFF3F1", position: 0 }, { color: "#BEE3EA", position: 100 }] } },
    globalStyles: { fontFamily: "Manrope", textColor: "#123B44", primaryColor: "#2A8FA6", radius: 18 },
    elements: [
      deco("shape", -30, 700, 450, 140, { styles: { kind: "line", fill: "#2A8FA6" }, zIndex: 1, name: "Wave" }),
      deco("shape", 270, -30, 130, 130, { styles: { kind: "blob", fill: "#7FCADB" }, rotation: 10, zIndex: 1 }),
      ...stack(
        [
          { type: "profile", x: 145, width: 100, height: 100, gap: 16, styles: { shape: "circle", shadow: true } },
          nameText({ fontSize: 23 }),
          bioText(),
          { type: "socials", height: 36, gap: 16, styles: { iconStyle: "circle", align: "center", color: "#2A8FA6" } },
          { type: "links", height: 200, styles: { variant: "soft", radius: 20, background: "#FFFFFFaa", textColor: "#123B44", itemHeight: 54 } },
        ],
        { startY: 64 }
      ),
    ],
  }),
];

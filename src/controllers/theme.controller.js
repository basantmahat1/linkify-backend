import { nanoid } from "nanoid";
import Theme from "../models/Theme.js";
import Page from "../models/Page.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sanitizeThemeConfig, validateForPublish } from "../utils/themeSchema.js";
import { escapeRegex } from "../utils/regex.js";

function slugify(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "theme"}-${nanoid(6).toLowerCase()}`;
}

// A minimal but valid starting point so a brand-new theme is never a blank
// broken canvas — admin edits from here in the builder.
function defaultConfig() {
  return sanitizeThemeConfig({
    canvas: { width: 390, minHeight: 844, background: { type: "solid", value: "#F8F0E8" } },
    globalStyles: { fontFamily: "Inter", textColor: "#222222", primaryColor: "#F2825E", radius: 16 },
    elements: [
      { id: "profile-1", type: "profile", x: 135, y: 60, width: 120, height: 120, zIndex: 10, props: {}, styles: { shape: "circle" } },
      { id: "socials-1", type: "socials", x: 75, y: 200, width: 240, height: 40, zIndex: 11, props: {}, styles: { iconStyle: "circle" } },
      { id: "links-1", type: "links", x: 30, y: 260, width: 330, height: 200, zIndex: 12, props: {}, styles: { variant: "outline" } },
    ],
  });
}

// ---------------------------------------------------------------------------
// Admin: CRUD
// ---------------------------------------------------------------------------

export const listThemes = asyncHandler(async (req, res) => {
  const { status = "all", category, search = "", page = 1, limit = 24 } = req.query;
  const filter = {};
  if (status !== "all") filter.status = status;
  if (category) filter.category = category;
  if (search && search.trim()) filter.name = new RegExp(escapeRegex(search.trim()), "i");

  const [items, total] = await Promise.all([
    Theme.find(filter)
      .select("-config -publishedConfig")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Theme.countDocuments(filter),
  ]);
  return ApiResponse(res, 200, items, "Themes", { total, page: Number(page), limit: Number(limit) });
});

export const createTheme = asyncHandler(async (req, res) => {
  const { name, description = "", category = "custom", thumbnail = "", fromThemeId } = req.body;

  let startConfig = defaultConfig();
  if (fromThemeId) {
    const source = await Theme.findById(fromThemeId).select("config");
    if (source) startConfig = source.config; // "start from existing theme" (§31)
  }

  const theme = await Theme.create({
    name,
    slug: slugify(name),
    description,
    category,
    thumbnail,
    status: "draft",
    config: startConfig,
    createdBy: req.user._id,
  });
  return ApiResponse(res, 201, theme, "Theme created");
});

export const getTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) throw new ApiError(404, "Theme not found");
  return ApiResponse(res, 200, theme);
});

export const updateTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) throw new ApiError(404, "Theme not found");
  if (theme.status === "archived") throw new ApiError(409, "Archived themes can't be edited — duplicate it instead");

  const { name, description, category, thumbnail, isPremium, config } = req.body;
  if (name !== undefined) theme.name = name;
  if (description !== undefined) theme.description = description;
  if (category !== undefined) theme.category = category;
  if (thumbnail !== undefined) theme.thumbnail = thumbnail;
  if (isPremium !== undefined) theme.isPremium = isPremium;
  if (config !== undefined) theme.config = sanitizeThemeConfig(config); // editing config never touches publishedConfig

  await theme.save();
  return ApiResponse(res, 200, theme, "Theme saved");
});

export const deleteTheme = asyncHandler(async (req, res) => {
  const inUse = await Page.countDocuments({ themeId: req.params.id });
  if (inUse > 0) throw new ApiError(409, `Theme is in use by ${inUse} page(s) — archive it instead of deleting`);
  const theme = await Theme.findByIdAndDelete(req.params.id);
  if (!theme) throw new ApiError(404, "Theme not found");
  return ApiResponse(res, 200, null, "Theme deleted");
});

// ---------------------------------------------------------------------------
// Admin: publish workflow
// ---------------------------------------------------------------------------

export const publishTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) throw new ApiError(404, "Theme not found");

  const { valid, errors } = validateForPublish(theme.config);
  if (!valid) throw new ApiError(422, "Theme failed publish validation", errors);

  theme.publishedConfig = theme.config; // snapshot — draft edits from now on don't affect live pages
  theme.status = "published";
  theme.version += 1;
  theme.publishedAt = new Date();
  await theme.save();

  return ApiResponse(res, 200, theme, `Published as version ${theme.version}`);
});

export const unpublishTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) throw new ApiError(404, "Theme not found");
  // publishedConfig is intentionally left in place so pages already using
  // this theme keep rendering correctly — it just drops out of the gallery.
  theme.status = "draft";
  await theme.save();
  return ApiResponse(res, 200, theme, "Theme unpublished — pages already using it are unaffected");
});

export const archiveTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
  if (!theme) throw new ApiError(404, "Theme not found");
  return ApiResponse(res, 200, theme, "Theme archived");
});

export const duplicateTheme = asyncHandler(async (req, res) => {
  const source = await Theme.findById(req.params.id);
  if (!source) throw new ApiError(404, "Theme not found");
  const copy = await Theme.create({
    name: `${source.name} Copy`,
    slug: slugify(`${source.name}-copy`),
    description: source.description,
    category: source.category,
    thumbnail: source.thumbnail,
    status: "draft",
    isPremium: source.isPremium,
    config: source.config, // start from the current draft, not stale published snapshot
    createdBy: req.user._id,
  });
  return ApiResponse(res, 201, copy, "Theme duplicated");
});

// ---------------------------------------------------------------------------
// Public: gallery + apply-to-page
// ---------------------------------------------------------------------------

export const listPublicThemes = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { status: "published" };
  if (category) filter.category = category;
  const themes = await Theme.find(filter).select("name slug description category thumbnail isPremium publishedConfig version").sort({
    publishedAt: -1,
  });
  return ApiResponse(res, 200, themes);
});

export const getPublicTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findOne({ slug: req.params.slug, status: "published" }).select(
    "name slug description category thumbnail isPremium publishedConfig version"
  );
  if (!theme) throw new ApiError(404, "Theme not found");
  return ApiResponse(res, 200, theme);
});

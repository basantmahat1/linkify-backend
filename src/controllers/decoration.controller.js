import fs from "fs/promises";
import path from "path";
import DecorationAsset, { CATEGORIES } from "../models/DecorationAsset.js";
import Theme from "../models/Theme.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sanitizeSvg } from "../utils/svgSanitize.js";
import { escapeRegex } from "../utils/regex.js";

export const listDecorationAssets = asyncHandler(async (req, res) => {
  const { category, search, activeOnly } = req.query;
  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (activeOnly === "true") filter.isActive = true;
  if (search && search.trim()) filter.name = new RegExp(escapeRegex(search.trim()), "i");
  const assets = await DecorationAsset.find(filter).sort({ createdAt: -1 });
  return ApiResponse(res, 200, assets, "Decoration assets", { categories: CATEGORIES });
});

// Upload a file AND register it as a DecorationAsset in one step — this is
// the "Upload Decoration" flow from the builder's Uploads tab.
export const uploadDecorationAsset = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const ext = path.extname(req.file.originalname).toLowerCase();
  const typeMap = { ".svg": "svg", ".png": "png", ".webp": "webp" };
  const type = typeMap[ext];
  if (!type) {
    await fs.unlink(req.file.path).catch(() => {});
    throw new ApiError(400, "Decorations must be SVG, PNG, or WebP");
  }

  let url = `/uploads/${req.file.filename}`;

  if (type === "svg") {
    // Never trust raw uploaded SVG — sanitize before it's ever served.
    try {
      const raw = await fs.readFile(req.file.path, "utf8");
      const clean = sanitizeSvg(raw);
      await fs.writeFile(req.file.path, clean, "utf8");
    } catch (err) {
      await fs.unlink(req.file.path).catch(() => {});
      throw new ApiError(400, `Unsafe or invalid SVG: ${err.message}`);
    }
  }

  const { name = req.file.originalname.replace(/\.[^.]+$/, ""), category = "custom", tags = "" } = req.body;
  if (!CATEGORIES.includes(category)) throw new ApiError(400, "Invalid category");

  const asset = await DecorationAsset.create({
    name: String(name).slice(0, 60),
    category,
    type,
    url,
    tags: String(tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10),
    createdBy: req.user._id,
  });

  return ApiResponse(res, 201, asset, "Decoration uploaded");
});

export const updateDecorationAsset = asyncHandler(async (req, res) => {
  const { name, category, tags, isActive } = req.body;
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) throw new ApiError(400, "Invalid category");
    patch.category = category;
  }
  if (tags !== undefined) patch.tags = Array.isArray(tags) ? tags.slice(0, 10) : [];
  if (isActive !== undefined) patch.isActive = !!isActive;

  const asset = await DecorationAsset.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!asset) throw new ApiError(404, "Decoration asset not found");
  return ApiResponse(res, 200, asset, "Decoration updated");
});

export const deleteDecorationAsset = asyncHandler(async (req, res) => {
  const inUse = await Theme.countDocuments({ "config.elements.props.assetId": req.params.id });
  if (inUse > 0) throw new ApiError(409, `This decoration is used in ${inUse} theme(s) — deactivate it instead of deleting`);
  const asset = await DecorationAsset.findByIdAndDelete(req.params.id);
  if (!asset) throw new ApiError(404, "Decoration asset not found");
  return ApiResponse(res, 200, null, "Decoration deleted");
});

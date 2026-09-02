import Page from "../models/Page.js";
import Link from "../models/Link.js";
import Product from "../models/Product.js";
import ClickEvent from "../models/ClickEvent.js";
import Theme from "../models/Theme.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { visibleNowFilter } from "../utils/schedule.js";
import { normalizeThemePatch } from "../validators/page.validator.js";

import User from "../models/User.js";
import { nanoid } from "nanoid";

export const getMyPage = asyncHandler(async (req, res) => {
  let page = await Page.findOne({ owner: req.user._id }).populate({ path: "themeId", select: "name slug category publishedConfig" });
  if (!page) {
    const user = await User.findById(req.user._id);
    let baseUsername = user?.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "") || `user-${nanoid(6)}`;
    if (baseUsername.length < 3) baseUsername = `user-${nanoid(6)}`;
    let username = baseUsername;
    let i = 0;
    while (await Page.findOne({ username })) {
      i += 1;
      username = `${baseUsername}${i}`;
    }
    page = await Page.create({
      owner: req.user._id,
      username,
      displayName: user?.name || "User",
    });
  }
  return ApiResponse(res, 200, page);
});

export const updateMyPage = asyncHandler(async (req, res) => {
  if (req.body.themeId) {
    const theme = await Theme.findById(req.body.themeId).select("status");
    if (!theme || theme.status !== "published") throw new ApiError(422, "That theme isn't available");
  }

  const page = await Page.findOne({ owner: req.user._id });
  if (!page) throw new ApiError(404, "Page not found");

  if (req.body.theme) {
    const incoming = normalizeThemePatch(req.body.theme);
    const base = normalizeThemePatch(page.theme?.toObject?.() || page.theme || {});
    page.theme = { ...base, ...incoming };
    if (page.theme.profileLayout === "card" || page.theme.profileLayout === "split") {
      page.theme.profileLayout = "professional";
    }
    page.markModified("theme");
    delete req.body.theme;
  }

  if (req.body.seo) {
    page.seo = { ...(page.seo?.toObject?.() || page.seo || {}), ...req.body.seo };
    delete req.body.seo;
  }

  if (typeof req.body.displayName === "string") {
    req.body.displayName = req.body.displayName.slice(0, 25);
  }
  if (typeof req.body.bio === "string") {
    req.body.bio = req.body.bio.slice(0, 160);
  }

  Object.assign(page, req.body);

  if (typeof page.displayName === "string" && page.displayName.length > 25) {
    page.displayName = page.displayName.slice(0, 25);
  }
  if (typeof page.bio === "string" && page.bio.length > 160) {
    page.bio = page.bio.slice(0, 160);
  }

  try {
    await page.save();
  } catch (err) {
    if (err?.name === "ValidationError") {
      const details = Object.values(err.errors || {}).map((e) => ({
        path: e.path,
        message: e.message,
      }));
      throw new ApiError(422, details[0]?.message || "Validation failed", details);
    }
    throw err;
  }

  return ApiResponse(res, 200, page, "Page updated");
});

export const getPublicPage = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const page = await Page.findOne({ username: username.toLowerCase(), isPublished: true }).populate({
    path: "themeId",
    select: "name slug publishedConfig", // never leak the editable draft config
  });
  if (!page) throw new ApiError(404, "This page does not exist");
  if (page.isBlocked) throw new ApiError(403, "This page has been taken down for violating our guidelines");

  const nowFilter = visibleNowFilter();
  const links = await Link.find({ page: page._id, isEnabled: true, ...nowFilter }).sort({ order: 1 });
  const products = await Product.find({ page: page._id, isEnabled: true, ...nowFilter }).sort({ order: 1 });

  Page.updateOne({ _id: page._id }, { $inc: { views: 1 } }).exec();
  ClickEvent.create({
    page: page._id,
    type: "view",
    referrer: req.get("referer") || "",
    device: /mobile/i.test(req.get("user-agent") || "") ? "mobile" : "desktop",
  }).catch(() => {});

  return ApiResponse(res, 200, { page, links, products });
});

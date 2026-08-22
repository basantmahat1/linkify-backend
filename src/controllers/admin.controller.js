import User from "../models/User.js";
import Page from "../models/Page.js";
import Link from "../models/Link.js";
import Report from "../models/Report.js";
import BlockedDomain from "../models/BlockedDomain.js";
import AuthSetting from "../models/AuthSetting.js";
import { cloudinary } from "../config/cloudinary.js";
import { PLANS } from "../config/plans.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/regex.js";
import fs from "fs";

export const getAdminStats = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    proUsers,
    businessUsers,
    totalPages,
    viewsAgg,
    reportedPages,
    downgradedRecently,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ plan: "pro" }),
    User.countDocuments({ plan: "business" }),
    Page.countDocuments(),
    Page.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    Report.countDocuments({ status: "pending" }),
    // Simplified churn proxy: paid-plan users deactivated in the last 30 days.
    // A real implementation would read Stripe subscription-cancelled events.
    User.countDocuments({ isActive: false, plan: { $ne: "free" }, updatedAt: { $gte: thirtyDaysAgo } }),
  ]);

  const paidUsers = proUsers + businessUsers;
  const mrr = proUsers * PLANS.pro.price + businessUsers * PLANS.business.price;
  const churnRate = paidUsers > 0 ? Number(((downgradedRecently / (paidUsers + downgradedRecently)) * 100).toFixed(1)) : 0;

  return ApiResponse(res, 200, {
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    paidUsers,
    proUsers,
    businessUsers,
    revenue: mrr, // monthly revenue == MRR in this simplified model (no annual plans yet)
    mrr,
    churnRate,
    totalPages,
    totalViews: viewsAgg[0]?.total || 0,
    reportedPages,
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const safeSearch = escapeRegex(search.trim());
  const filter = safeSearch ? { $or: [{ name: new RegExp(safeSearch, "i") }, { email: new RegExp(safeSearch, "i") }] } : {};
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    User.countDocuments(filter),
  ]);
  return ApiResponse(res, 200, items, "Users", {
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.max(1, Math.ceil(total / limitNum)),
  });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  if (!user) throw new ApiError(404, "User not found");
  return ApiResponse(res, 200, user, req.body.isActive ? "User re-enabled" : "User disabled");
});

// ---- Moderation: reports ----

export const listReports = asyncHandler(async (req, res) => {
  const { status = "pending", page = 1, limit = 20 } = req.query;
  const filter = status === "all" ? {} : { status };
  const [items, total] = await Promise.all([
    Report.find(filter)
      .populate("page", "username displayName isBlocked reportCount")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Report.countDocuments(filter),
  ]);
  return ApiResponse(res, 200, items, "Reports", { total, page: Number(page), limit: Number(limit) });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { status } = req.body; // "resolved" | "dismissed"
  if (!["resolved", "dismissed"].includes(status)) throw new ApiError(422, "Invalid status");
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status, resolvedBy: req.user._id, resolvedAt: new Date() },
    { new: true }
  );
  if (!report) throw new ApiError(404, "Report not found");
  return ApiResponse(res, 200, report, "Report updated");
});

// ---- Moderation: pages ----

export const blockPage = asyncHandler(async (req, res) => {
  const { blocked, reason = "" } = req.body;
  const page = await Page.findByIdAndUpdate(
    req.params.id,
    { isBlocked: !!blocked, blockedReason: blocked ? reason : "" },
    { new: true }
  );
  if (!page) throw new ApiError(404, "Page not found");
  return ApiResponse(res, 200, page, blocked ? "Page taken down" : "Page restored");
});

export const deletePage = asyncHandler(async (req, res) => {
  const page = await Page.findByIdAndDelete(req.params.id);
  if (!page) throw new ApiError(404, "Page not found");
  await Link.deleteMany({ page: page._id });
  return ApiResponse(res, 200, null, "Page and its links deleted");
});

// ---- Moderation: suspicious links ----

export const listSuspiciousLinks = asyncHandler(async (req, res) => {
  const links = await Link.find({ isSuspicious: true }).populate("page", "username displayName").sort({ createdAt: -1 }).limit(50);
  return ApiResponse(res, 200, links);
});

export const clearSuspiciousFlag = asyncHandler(async (req, res) => {
  const link = await Link.findByIdAndUpdate(req.params.id, { isSuspicious: false }, { new: true });
  if (!link) throw new ApiError(404, "Link not found");
  return ApiResponse(res, 200, link, "Flag cleared");
});

// ---- Moderation: blocked domains ----

export const listBlockedDomains = asyncHandler(async (req, res) => {
  const domains = await BlockedDomain.find().sort({ createdAt: -1 });
  return ApiResponse(res, 200, domains);
});

export const addBlockedDomain = asyncHandler(async (req, res) => {
  const { domain, reason = "" } = req.body;
  if (!domain) throw new ApiError(422, "domain is required");
  const clean = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const existing = await BlockedDomain.findOne({ domain: clean });
  if (existing) throw new ApiError(409, "Domain is already blocked");
  const blocked = await BlockedDomain.create({ domain: clean, reason, addedBy: req.user._id });
  return ApiResponse(res, 201, blocked, "Domain blocked");
});

export const removeBlockedDomain = asyncHandler(async (req, res) => {
  const removed = await BlockedDomain.findByIdAndDelete(req.params.id);
  if (!removed) throw new ApiError(404, "Not found");
  return ApiResponse(res, 200, null, "Domain unblocked");
});

// ---- Branding: email logo ----

export const getEmailLogo = asyncHandler(async (req, res) => {
  const settings = await AuthSetting.findOne();
  return ApiResponse(res, 200, { emailLogo: settings?.emailLogo || "" }, "Email logo fetched");
});

export const uploadEmailLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  try {
    // Upload to Cloudinary under branding folder
    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: "email-logo",
      overwrite: true,
      folder: "branding",
      transformation: [{ width: 120, height: 120, crop: "fit" }],
    });

    // Save URL to DB
    let settings = await AuthSetting.findOne();
    if (!settings) {
      settings = await AuthSetting.create({ emailLogo: result.secure_url });
    } else {
      settings.emailLogo = result.secure_url;
      await settings.save();
    }

    return ApiResponse(res, 200, { emailLogo: result.secure_url }, "Email logo updated successfully");
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

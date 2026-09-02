import Link from "../models/Link.js";
import Page from "../models/Page.js";
import ClickEvent from "../models/ClickEvent.js";
import BlockedDomain from "../models/BlockedDomain.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { planLimits } from "../config/plans.js";
import { extractDomain, isSuspiciousLink } from "../utils/spamCheck.js";
import { isScheduleActive } from "../utils/schedule.js";

import User from "../models/User.js";
import { nanoid } from "nanoid";

async function getOwnedPage(userId) {
  let page = await Page.findOne({ owner: userId });
  if (!page) {
    const user = await User.findById(userId);
    let baseUsername = user?.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "") || `user-${nanoid(6)}`;
    if (baseUsername.length < 3) baseUsername = `user-${nanoid(6)}`;
    let username = baseUsername;
    let i = 0;
    while (await Page.findOne({ username })) {
      i += 1;
      username = `${baseUsername}${i}`;
    }
    page = await Page.create({
      owner: userId,
      username,
      displayName: user?.name || "User",
    });
  }
  return page;
}

export const listLinks = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);

  const links = await Link.find({ page: page._id }).sort({ order: 1 });
  const total = links.length;

  return ApiResponse(res, 200, links, "Success", {
    total,
    page: 1,
    pages: 1,
  });
});

export const createLink = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);
  const limits = planLimits(req.user.plan);
  const count = await Link.countDocuments({ page: page._id });
  if (count >= limits.maxLinks) {
    throw new ApiError(403, `Your ${limits.name} plan is limited to ${limits.maxLinks} links. Upgrade for unlimited links.`);
  }

  const domain = extractDomain(req.body.url);
  const blocked = domain && (await BlockedDomain.findOne({ domain }));
  if (blocked) {
    throw new ApiError(403, "This domain is blocked and can't be linked to.");
  }

  const suspicious = isSuspiciousLink(req.body);
  const link = await Link.create({ ...req.body, page: page._id, order: count, isSuspicious: suspicious });
  return ApiResponse(res, 201, link, suspicious ? "Link added — flagged for review due to suspicious content" : "Link created");
});

export const updateLink = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);
  
  const link = await Link.findOneAndUpdate({ _id: req.params.id, page: page._id }, { $set: req.body }, { new: true, runValidators: true });
  if (!link) throw new ApiError(404, "Link not found");
  return ApiResponse(res, 200, link, "Link updated");
});

export const deleteLink = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);
  const link = await Link.findOneAndDelete({ _id: req.params.id, page: page._id });
  if (!link) throw new ApiError(404, "Link not found");
  return ApiResponse(res, 200, null, "Link deleted");
});

export const reorderLinks = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);
  const { order } = req.body;
  const ops = order.map((id, index) => ({
    updateOne: { filter: { _id: id, page: page._id }, update: { $set: { order: index } } },
  }));
  await Link.bulkWrite(ops);
  const links = await Link.find({ page: page._id }).sort({ order: 1 });
  return ApiResponse(res, 200, links, "Links reordered");
});

export const trackClick = asyncHandler(async (req, res) => {
  const link = await Link.findById(req.params.id);
  if (!link) throw new ApiError(404, "Link not found");
  if (!link.isEnabled || !isScheduleActive(link.schedule)) {
    throw new ApiError(404, "This link is not available");
  }
  Link.updateOne({ _id: link._id }, { $inc: { clicks: 1 } }).exec();
  ClickEvent.create({
    page: link.page,
    link: link._id,
    type: "click",
    referrer: req.get("referer") || "",
    device: /mobile/i.test(req.get("user-agent") || "") ? "mobile" : "desktop",
  }).catch(() => {});
  return ApiResponse(res, 200, { url: link.url }, "Tracked");
});

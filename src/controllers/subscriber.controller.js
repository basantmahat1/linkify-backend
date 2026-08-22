import Page from "../models/Page.js";
import Subscriber from "../models/Subscriber.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/regex.js";

export const subscribe = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ username: req.params.username.toLowerCase() });
  if (!page) throw new ApiError(404, "Page not found");
  const { email, name } = req.body;
  if (!email) throw new ApiError(422, "Email is required");
  const sub = await Subscriber.findOneAndUpdate(
    { page: page._id, email: email.toLowerCase() },
    { $set: { name: name || "" } },
    { upsert: true, new: true }
  );
  return ApiResponse(res, 201, sub, "Subscribed");
});

export const listSubscribers = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ owner: req.user._id });
  if (!page) throw new ApiError(404, "Page not found");
  const { page: p = 1, limit = 20, search = "" } = req.query;
  const safeSearch = escapeRegex(search.trim());
  const filter = { page: page._id, ...(safeSearch ? { email: new RegExp(safeSearch, "i") } : {}) };
  const [items, total] = await Promise.all([
    Subscriber.find(filter).sort({ createdAt: -1 }).skip((p - 1) * limit).limit(Number(limit)),
    Subscriber.countDocuments(filter),
  ]);
  return ApiResponse(res, 200, items, "Subscribers", { total, page: Number(p), limit: Number(limit) });
});

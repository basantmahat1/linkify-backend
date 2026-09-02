import Product from "../models/Product.js";
import Page from "../models/Page.js";
import ClickEvent from "../models/ClickEvent.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { planLimits } from "../config/plans.js";
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

export const listProducts = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);

  const products = await Product.find({ page: page._id }).sort({ order: 1 });
  const total = products.length;

  return ApiResponse(res, 200, products, "Success", {
    total,
    page: 1,
    pages: 1,
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);
  const limits = planLimits(req.user.plan);
  const count = await Product.countDocuments({ page: page._id });
  if (count >= limits.maxProducts) {
    throw new ApiError(403, `Your ${limits.name} plan is limited to ${limits.maxProducts} products. Upgrade to add more.`);
  }

  const product = await Product.create({ ...req.body, page: page._id, order: count });
  return ApiResponse(res, 201, product, "Product added");
});

export const updateProduct = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);
  const product = await Product.findOneAndUpdate({ _id: req.params.id, page: page._id }, { $set: req.body }, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, "Product not found");
  return ApiResponse(res, 200, product, "Product updated");
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);
  const product = await Product.findOneAndDelete({ _id: req.params.id, page: page._id });
  if (!product) throw new ApiError(404, "Product not found");
  return ApiResponse(res, 200, null, "Product deleted");
});

export const reorderProducts = asyncHandler(async (req, res) => {
  const page = await getOwnedPage(req.user._id);
  const { order } = req.body;
  const ops = order.map((id, index) => ({
    updateOne: { filter: { _id: id, page: page._id }, update: { $set: { order: index } } },
  }));
  await Product.bulkWrite(ops);
  const products = await Product.find({ page: page._id }).sort({ order: 1 });
  return ApiResponse(res, 200, products, "Products reordered");
});

export const trackProductClick = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  if (!product.isEnabled || !isScheduleActive(product.schedule)) {
    throw new ApiError(404, "This product is not available");
  }
  Product.updateOne({ _id: product._id }, { $inc: { clicks: 1 } }).exec();
  ClickEvent.create({
    page: product.page,
    product: product._id,
    type: "click",
    referrer: req.get("referer") || "",
    device: /mobile/i.test(req.get("user-agent") || "") ? "mobile" : "desktop",
  }).catch(() => {});
  return ApiResponse(res, 200, { url: product.checkoutUrl }, "Tracked");
});

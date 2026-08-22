import Page from "../models/Page.js";
import Link from "../models/Link.js";
import Product from "../models/Product.js";
import ClickEvent from "../models/ClickEvent.js";
import Subscriber from "../models/Subscriber.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
}

function startOfMonth() {
  const x = startOfDay();
  x.setDate(1);
  return x;
}

async function countEvents(pageId, type, since = null, extra = {}) {
  const filter = { page: pageId, type, ...extra };
  if (since) filter.createdAt = { $gte: since };
  return ClickEvent.countDocuments(filter);
}

function calcCtr(clicks, views) {
  if (!views) return 0;
  return Number(((clicks / views) * 100).toFixed(1));
}

export const getOverview = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ owner: req.user._id });
  if (!page) throw new ApiError(404, "Page not found");

  const todayStart = startOfDay();
  const weekStart = daysAgo(6); // last 7 days including today
  const monthStart = startOfMonth();
  const dailySince = daysAgo(13);

  const linkFilter = { link: { $ne: null } };
  const productFilter = { product: { $ne: null } };

  const [
    viewsToday,
    viewsWeek,
    viewsMonth,
    viewsTotal,
    clicksToday,
    clicksWeek,
    clicksMonth,
    clicksTotal,
    productClicksToday,
    productClicksWeek,
    productClicksMonth,
    productClicksTotal,
    subscriberCount,
    links,
    products,
    daily,
  ] = await Promise.all([
    countEvents(page._id, "view", todayStart),
    countEvents(page._id, "view", weekStart),
    countEvents(page._id, "view", monthStart),
    countEvents(page._id, "view"),
    countEvents(page._id, "click", todayStart, linkFilter),
    countEvents(page._id, "click", weekStart, linkFilter),
    countEvents(page._id, "click", monthStart, linkFilter),
    countEvents(page._id, "click", null, linkFilter),
    countEvents(page._id, "click", todayStart, productFilter),
    countEvents(page._id, "click", weekStart, productFilter),
    countEvents(page._id, "click", monthStart, productFilter),
    countEvents(page._id, "click", null, productFilter),
    Subscriber.countDocuments({ page: page._id }),
    Link.find({ page: page._id }).sort({ clicks: -1 }).select("title url clicks icon platform isEnabled"),
    Product.find({ page: page._id }).sort({ clicks: -1 }).select("name price image clicks isEnabled checkoutUrl"),
    ClickEvent.aggregate([
      { $match: { page: page._id, createdAt: { $gte: dailySince } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]),
  ]);

  const maxClicks = links.reduce((m, l) => Math.max(m, l.clicks || 0), 0);
  const linkPerformance = links.map((l) => ({
    _id: l._id,
    title: l.title,
    url: l.url,
    clicks: l.clicks || 0,
    icon: l.icon || l.platform || "",
    isEnabled: l.isEnabled,
    share: clicksTotal > 0 ? Number((((l.clicks || 0) / clicksTotal) * 100).toFixed(1)) : 0,
    bar: maxClicks > 0 ? Math.round(((l.clicks || 0) / maxClicks) * 100) : 0,
  }));

  const maxProductClicks = products.reduce((m, p) => Math.max(m, p.clicks || 0), 0);
  const productPerformance = products.map((p) => ({
    _id: p._id,
    name: p.name,
    price: p.price,
    image: p.image || "",
    clicks: p.clicks || 0,
    isEnabled: p.isEnabled,
    share: productClicksTotal > 0 ? Number((((p.clicks || 0) / productClicksTotal) * 100).toFixed(1)) : 0,
    bar: maxProductClicks > 0 ? Math.round(((p.clicks || 0) / maxProductClicks) * 100) : 0,
  }));

  return ApiResponse(res, 200, {
    views: {
      today: viewsToday,
      week: viewsWeek,
      month: viewsMonth,
      total: viewsTotal,
    },
    clicks: {
      today: clicksToday,
      week: clicksWeek,
      month: clicksMonth,
      total: clicksTotal,
    },
    ctr: {
      overall: calcCtr(clicksTotal, viewsTotal),
      today: calcCtr(clicksToday, viewsToday),
      week: calcCtr(clicksWeek, viewsWeek),
      month: calcCtr(clicksMonth, viewsMonth),
    },
    productClicks: {
      today: productClicksToday,
      week: productClicksWeek,
      month: productClicksMonth,
      total: productClicksTotal,
    },
    productCtr: {
      overall: calcCtr(productClicksTotal, viewsTotal),
      today: calcCtr(productClicksToday, viewsToday),
      week: calcCtr(productClicksWeek, viewsWeek),
      month: calcCtr(productClicksMonth, viewsMonth),
    },
    subscriberCount,
    linkPerformance,
    productPerformance,
    // backwards-compatible aliases used by older UI
    totalViews: viewsTotal,
    totalClicks: clicksTotal,
    topLinks: linkPerformance.slice(0, 5).map(({ _id, title, clicks }) => ({ _id, title, clicks })),
    daily,
  });
});

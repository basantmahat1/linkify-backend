import Page from "../models/Page.js";
import Report from "../models/Report.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createReport = asyncHandler(async (req, res) => {
  const { username, reason, details, reporterEmail } = req.body;
  if (!username || !reason) throw new ApiError(422, "username and reason are required");

  const page = await Page.findOne({ username: username.toLowerCase() });
  if (!page) throw new ApiError(404, "Page not found");

  const report = await Report.create({ page: page._id, reason, details, reporterEmail });
  await Page.updateOne({ _id: page._id }, { $inc: { reportCount: 1 } });

  return ApiResponse(res, 201, report, "Report submitted. Our team will review this page.");
});

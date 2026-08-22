import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  try {
    // Synchronous upload to Cloudinary directly for now
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "uploads",
      resource_type: "auto",
    });

    return ApiResponse(res, 201, { url: result.secure_url }, "File uploaded successfully");
  } finally {
    // Clean up local file
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

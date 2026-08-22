import { SocialLinks } from "../models/SocialLinks.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getSocialLinks = asyncHandler(async (req, res) => {
  let links = await SocialLinks.findOne();
  if (!links) {
    links = await SocialLinks.create({});
  }
  return ApiResponse(res, 200, links, "Links fetched");
});

export const updateSocialLinks = asyncHandler(async (req, res) => {
  const { instagram, facebook, tiktok, x } = req.body;
  let links = await SocialLinks.findOne();
  if (!links) {
    links = await SocialLinks.create({ instagram, facebook, tiktok, x });
  } else {
    links.instagram = instagram;
    links.facebook = facebook;
    links.tiktok = tiktok;
    links.x = x;
    await links.save();
  }
  return ApiResponse(res, 200, links, "Links updated");
});

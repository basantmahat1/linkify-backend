import AuthSetting, { DEFAULT_LOGIN_IMAGE, DEFAULT_REGISTER_IMAGE } from "../models/AuthSetting.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function getOrCreateSettings() {
  let settings = await AuthSetting.findOne();
  if (!settings) {
    settings = await AuthSetting.create({
      loginImage: DEFAULT_LOGIN_IMAGE,
      registerImage: DEFAULT_REGISTER_IMAGE,
    });
  } else {
    // Automatically purge legacy unsplash image URLs if present
    let modified = false;
    if (settings.loginImage && settings.loginImage.includes("unsplash.com")) {
      settings.loginImage = "";
      modified = true;
    }
    if (settings.registerImage && settings.registerImage.includes("unsplash.com")) {
      settings.registerImage = "";
      modified = true;
    }
    if (modified) {
      await settings.save();
    }
  }
  return settings;
}

export const getAuthSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  return ApiResponse(res, 200, settings, "Auth settings fetched");
});

export const updateAuthSettings = asyncHandler(async (req, res) => {
  const { loginImage, registerImage } = req.body;
  let settings = await getOrCreateSettings();

  if (loginImage !== undefined) settings.loginImage = loginImage;
  if (registerImage !== undefined) settings.registerImage = registerImage;

  await settings.save();
  return ApiResponse(res, 200, settings, "Auth settings updated successfully");
});

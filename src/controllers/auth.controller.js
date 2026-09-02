import User from "../models/User.js";
import Page from "../models/Page.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signAccessToken, signRefreshToken, setAuthCookies, clearAuthCookies, verifyRefreshToken } from "../utils/tokens.js";
import { env } from "../config/env.js";
import { nanoid } from "nanoid";
import { createOtp, verifyOtp as verifyOtpService } from "../utils/otp.service.js";
import { sendOtpEmail } from "../utils/email.service.js";
import { normalizeEmail } from "../utils/emailValidator.js";

function issueTokens(res, user) {
  const payload = { sub: user._id.toString(), role: user.role, v: user.refreshTokenVersion };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setAuthCookies(res, { accessToken, refreshToken });
}

export const register = asyncHandler(async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = normalizeEmail(rawEmail);
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  // Derive name from email
  const name = email.split("@")[0].replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim() || "User";

  const user = await User.create({ name, email, password, isEmailVerified: false });

  let baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  if (baseUsername.length < 3) baseUsername = `user-${nanoid(6)}`;
  let username = baseUsername;
  let i = 0;
  while (await Page.findOne({ username })) {
    i += 1;
    username = `${baseUsername}${i}`;
  }

  await Page.create({ owner: user._id, username, displayName: name });

  // Generate and send OTP instead of issuing tokens
  const clientIp = req.ip || req.connection?.remoteAddress || "";
  const otp = await createOtp(email, clientIp);
  await sendOtpEmail(email, name, otp);

  return ApiResponse(res, 201, { requiresVerification: true, email }, "Account created. Please verify your email.");
});

export const login = asyncHandler(async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = normalizeEmail(rawEmail);
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive) throw new ApiError(403, "This account has been disabled");

  // If email not verified, send OTP and require verification
  if (!user.isEmailVerified) {
    const clientIp = req.ip || req.connection?.remoteAddress || "";
    try {
      const otp = await createOtp(email, clientIp);
      await sendOtpEmail(email, user.name, otp);
    } catch (err) {
      // If rate limited on OTP, still tell them to verify (they may already have a valid OTP)
      if (err.statusCode !== 429) throw err;
    }
    return ApiResponse(res, 200, { requiresVerification: true, email }, "Please verify your email to continue.");
  }

  issueTokens(res, user);
  return ApiResponse(res, 200, user.toSafeObject(), "Logged in");
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email: rawEmail, otp } = req.body;
  const email = normalizeEmail(rawEmail);

  // Verify the OTP (throws on failure with descriptive message)
  await verifyOtpService(email, otp);

  // Mark user as email-verified
  const user = await User.findOneAndUpdate(
    { email },
    { isEmailVerified: true },
    { new: true }
  );

  if (!user) throw new ApiError(404, "User not found");

  // Issue tokens and set secure cookies
  issueTokens(res, user);
  return ApiResponse(res, 200, user.toSafeObject(), "Email verified successfully");
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = normalizeEmail(rawEmail);

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether account exists — return generic success
    return ApiResponse(res, 200, { email }, "If an account exists, a new code has been sent.");
  }

  if (user.isEmailVerified) {
    return ApiResponse(res, 200, { email }, "Email is already verified.");
  }

  const clientIp = req.ip || req.connection?.remoteAddress || "";
  const otp = await createOtp(email, clientIp);
  await sendOtpEmail(email, user.name, otp);

  return ApiResponse(res, 200, { email }, "A new verification code has been sent to your email.");
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "No refresh token");
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Refresh token invalid or expired");
  }
  const user = await User.findById(payload.sub);
  if (!user || user.refreshTokenVersion !== payload.v) throw new ApiError(401, "Session invalidated");
  issueTokens(res, user);
  return ApiResponse(res, 200, user.toSafeObject(), "Session refreshed");
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  return ApiResponse(res, 200, null, "Logged out");
});

export const me = asyncHandler(async (req, res) => {
  return ApiResponse(res, 200, req.user.toSafeObject(), "Current user");
});

export const googleCallback = asyncHandler(async (req, res) => {
  const clientUrl = (env.clientUrl || "http://localhost:5173").replace(/\/+$/, "");
  if (!req.user) {
    console.error("[OAuth] No user attached to req in googleCallback!");
    return res.redirect(`${clientUrl}/login?error=google_user_missing`);
  }
  console.log("Google callback received, issuing tokens for user:", req.user._id);
  issueTokens(res, req.user);
  const redirectUrl = `${clientUrl}/dashboard`;
  console.log("Redirecting to:", redirectUrl);
  res.redirect(redirectUrl);
});

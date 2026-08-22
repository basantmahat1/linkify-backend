import crypto from "crypto";
import Otp from "../models/Otp.js";
import { ApiError } from "./ApiError.js";
import { normalizeEmail } from "./emailValidator.js";

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTPS_PER_EMAIL_PER_HOUR = 5;
const MAX_OTPS_PER_IP_PER_HOUR = 10;

/**
 * Hash an OTP using SHA-256 (one-way, never stored plain)
 */
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Generate a cryptographically secure 6-digit OTP
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create and store a new OTP for the given email.
 * Enforces resend cooldown and hourly rate limits.
 * Returns the plain OTP (to be sent via email, never stored).
 */
export async function createOtp(email, ip = "") {
  const normalizedEmail = normalizeEmail(email);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // ── Resend cooldown (60 seconds) ──
  const lastOtp = await Otp.findOne({ email: normalizedEmail })
    .sort({ createdAt: -1 })
    .lean();

  if (lastOtp) {
    const secondsSinceLastOtp =
      (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
    if (secondsSinceLastOtp < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(
        RESEND_COOLDOWN_SECONDS - secondsSinceLastOtp
      );
      throw new ApiError(
        429,
        `Please wait ${waitSeconds} seconds before requesting a new code`
      );
    }
  }

  // ── Email rate limit (5 per hour) ──
  const emailCount = await Otp.countDocuments({
    email: normalizedEmail,
    createdAt: { $gte: oneHourAgo },
  });
  if (emailCount >= MAX_OTPS_PER_EMAIL_PER_HOUR) {
    throw new ApiError(
      429,
      "Too many verification attempts for this email. Please try again later."
    );
  }

  // ── IP rate limit (10 per hour) ──
  if (ip) {
    const ipCount = await Otp.countDocuments({
      ip,
      createdAt: { $gte: oneHourAgo },
    });
    if (ipCount >= MAX_OTPS_PER_IP_PER_HOUR) {
      throw new ApiError(
        429,
        "Too many requests from this IP. Please try again later."
      );
    }
  }

  // ── Invalidate all previous unused OTPs for this email ──
  await Otp.updateMany(
    { email: normalizedEmail, used: false },
    { $set: { used: true } }
  );

  // ── Generate and store new OTP ──
  const plainOtp = generateOtp();
  const otpHash = hashOtp(plainOtp);

  await Otp.create({
    email: normalizedEmail,
    otpHash,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    attempts: 0,
    used: false,
    ip,
  });

  return plainOtp;
}

/**
 * Verify an OTP against the stored hash.
 * Enforces single-use, expiry, and brute-force protection.
 * Returns true on success, throws on failure.
 */
export async function verifyOtp(email, plainOtp) {
  const normalizedEmail = normalizeEmail(email);

  // Find the latest unused, unexpired OTP for this email
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(
      400,
      "Verification code has expired or is invalid. Please request a new one."
    );
  }

  // ── Brute-force check ──
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    // Invalidate the OTP
    otpRecord.used = true;
    await otpRecord.save();
    throw new ApiError(
      429,
      "Too many incorrect attempts. This code has been invalidated. Please request a new one."
    );
  }

  // ── Compare hashes ──
  const candidateHash = hashOtp(plainOtp);
  if (candidateHash !== otpRecord.otpHash) {
    // Increment attempt counter
    otpRecord.attempts += 1;
    await otpRecord.save();

    const remaining = MAX_ATTEMPTS - otpRecord.attempts;
    if (remaining <= 0) {
      otpRecord.used = true;
      await otpRecord.save();
      throw new ApiError(
        429,
        "Too many incorrect attempts. This code has been invalidated. Please request a new one."
      );
    }

    throw new ApiError(
      400,
      `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
    );
  }

  // ── Success — mark as used (single-use) ──
  otpRecord.used = true;
  await otpRecord.save();

  return true;
}

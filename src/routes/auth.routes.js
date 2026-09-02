import { Router } from "express";
import passport from "passport";
import { register, login, refresh, logout, me, googleCallback, verifyOtp, resendOtp } from "../controllers/auth.controller.js";
import { getAuthSettings } from "../controllers/authSetting.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema } from "../validators/auth.validator.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter, otpVerifyLimiter, otpResendLimiter } from "../middleware/rateLimit.middleware.js";
import { env } from "../config/env.js";

const router = Router();

router.get("/settings", getAuthSettings);

router.get("/google", (req, res, next) => {
  if (!env.googleClientId || !env.googleClientSecret) {
    const clientUrl = (env.clientUrl || "http://localhost:5173").replace(/\/+$/, "");
    console.error("[OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in environment!");
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    const clientUrl = (env.clientUrl || "http://localhost:5173").replace(/\/+$/, "");
    passport.authenticate("google", {
      failureRedirect: `${clientUrl}/login?error=google_callback_failed`,
    })(req, res, next);
  },
  googleCallback
);

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/verify-otp", otpVerifyLimiter, validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", otpResendLimiter, validate(resendOtpSchema), resendOtp);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;

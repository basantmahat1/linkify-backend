import { Router } from "express";
import passport from "passport";
import { register, login, refresh, logout, me, googleCallback, verifyOtp, resendOtp } from "../controllers/auth.controller.js";
import { getAuthSettings } from "../controllers/authSetting.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema } from "../validators/auth.validator.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter, otpVerifyLimiter, otpResendLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.get("/settings", getAuthSettings);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), googleCallback);

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/verify-otp", otpVerifyLimiter, validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", otpResendLimiter, validate(resendOtpSchema), resendOtp);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;

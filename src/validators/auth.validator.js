import { z } from "zod";
import { isValidEmail } from "../utils/emailValidator.js";

const emailValidator = z.string().refine((val) => isValidEmail(val), {
  message: "Please enter a valid email address.",
});

export const registerSchema = z.object({
  body: z.object({
    email: emailValidator,
    password: z.string().min(8).max(72),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailValidator,
    password: z.string().min(1),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: emailValidator,
    otp: z.string().length(6).regex(/^\d{6}$/, "OTP must be a 6-digit number"),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: emailValidator,
  }),
});


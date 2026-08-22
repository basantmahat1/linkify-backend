import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL — auto-deletes when expiresAt is reached
    },
    attempts: {
      type: Number,
      default: 0,
    },
    used: {
      type: Boolean,
      default: false,
    },
    ip: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index for rate-limit queries
otpSchema.index({ email: 1, createdAt: -1 });
otpSchema.index({ ip: 1, createdAt: -1 });

export default mongoose.model("Otp", otpSchema);

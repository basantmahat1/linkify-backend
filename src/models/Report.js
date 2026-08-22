import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    page: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    reason: { type: String, enum: ["spam", "scam", "adult_content", "impersonation", "malware", "other"], required: true },
    details: { type: String, maxlength: 500, default: "" },
    reporterEmail: { type: String, default: "" },
    status: { type: String, enum: ["pending", "resolved", "dismissed"], default: "pending", index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);

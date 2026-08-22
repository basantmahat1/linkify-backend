import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    page: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
  },
  { timestamps: true }
);

subscriberSchema.index({ page: 1, email: 1 }, { unique: true });

export default mongoose.model("Subscriber", subscriberSchema);

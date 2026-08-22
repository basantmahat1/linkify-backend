import { Queue, Worker } from "bullmq";
import { env } from "../config/env.js";
import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";

export const uploadQueue = new Queue("upload-queue", {
  connection: {
    url: env.redisUri,
  },
});

export const uploadWorker = new Worker(
  "upload-queue",
  async (job) => {
    const { filePath, originalName, userId } = job.data;
    
    // Perform actual upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "uploads",
      resource_type: "auto",
    });

    // Clean up local file
    fs.unlinkSync(filePath);

    // Update database (pseudo-code, you need to import your model)
    // await YourModel.findByIdAndUpdate(userId, { url: result.secure_url });
    
    return result.secure_url;
  },
  {
    connection: {
      url: env.redisUri,
    },
  }
);

import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp4", ".webm"];

export const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new ApiError(400, "Unsupported file type"));
    cb(null, true);
  },
});

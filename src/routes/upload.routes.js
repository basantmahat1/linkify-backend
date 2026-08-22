import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = Router();
router.post("/image", requireAuth, upload.single("file"), uploadImage);
export default router;

import express from "express";
import { getSocialLinks, updateSocialLinks } from "../controllers/socialLinks.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getSocialLinks);
router.put("/", requireAuth, requireRole("admin"), updateSocialLinks);

export default router;

import { Router } from "express";
import { getMyPage, updateMyPage, getPublicPage } from "../controllers/page.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updatePageSchema } from "../validators/page.validator.js";

const router = Router();

router.get("/me", requireAuth, getMyPage);
router.patch("/me", requireAuth, validate(updatePageSchema), updateMyPage);
router.get("/public/:username", getPublicPage);

export default router;

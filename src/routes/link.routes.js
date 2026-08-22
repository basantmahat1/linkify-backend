import { Router } from "express";
import { listLinks, createLink, updateLink, deleteLink, reorderLinks, trackClick } from "../controllers/link.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createLinkSchema, updateLinkSchema, reorderLinksSchema } from "../validators/link.validator.js";

const router = Router();

router.get("/", requireAuth, listLinks);
router.post("/", requireAuth, validate(createLinkSchema), createLink);
router.patch("/reorder", requireAuth, validate(reorderLinksSchema), reorderLinks);
router.patch("/:id", requireAuth, validate(updateLinkSchema), updateLink);
router.delete("/:id", requireAuth, deleteLink);
router.post("/:id/click", trackClick);

export default router;

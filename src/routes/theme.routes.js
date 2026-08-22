import { Router } from "express";
import {
  listThemes,
  createTheme,
  getTheme,
  updateTheme,
  deleteTheme,
  publishTheme,
  unpublishTheme,
  archiveTheme,
  duplicateTheme,
} from "../controllers/theme.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createThemeSchema, updateThemeSchema, listThemesQuerySchema } from "../validators/theme.validator.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", validate(listThemesQuerySchema), listThemes);
router.post("/", validate(createThemeSchema), createTheme);
router.get("/:id", getTheme);
router.patch("/:id", validate(updateThemeSchema), updateTheme);
router.delete("/:id", deleteTheme);

router.post("/:id/publish", publishTheme);
router.post("/:id/unpublish", unpublishTheme);
router.post("/:id/archive", archiveTheme);
router.post("/:id/duplicate", duplicateTheme);

export default router;

import { Router } from "express";
import { listPublicThemes, getPublicTheme } from "../controllers/theme.controller.js";

const router = Router();

router.get("/", listPublicThemes);
router.get("/:slug", getPublicTheme);

export default router;

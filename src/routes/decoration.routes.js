import { Router } from "express";
import { listDecorationAssets, uploadDecorationAsset, updateDecorationAsset, deleteDecorationAsset } from "../controllers/decoration.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", listDecorationAssets);
router.post("/upload", upload.single("file"), uploadDecorationAsset);
router.patch("/:id", updateDecorationAsset);
router.delete("/:id", deleteDecorationAsset);

export default router;

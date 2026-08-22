import { Router } from "express";
import { subscribe, listSubscribers } from "../controllers/subscriber.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.post("/:username", authLimiter, subscribe);
router.get("/", requireAuth, listSubscribers);
export default router;

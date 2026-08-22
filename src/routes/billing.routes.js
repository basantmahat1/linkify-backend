import { Router } from "express";
import { getPlans, upgradePlan } from "../controllers/billing.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.get("/plans", getPlans);
router.post("/upgrade", requireAuth, upgradePlan);
export default router;

import { Router } from "express";
import { createReport } from "../controllers/report.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createReportSchema } from "../validators/report.validator.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.post("/", authLimiter, validate(createReportSchema), createReport);
export default router;

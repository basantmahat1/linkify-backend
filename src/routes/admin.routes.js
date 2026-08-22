import { Router } from "express";
import {
  getAdminStats,
  listUsers,
  setUserActive,
  listReports,
  resolveReport,
  blockPage,
  deletePage,
  listSuspiciousLinks,
  clearSuspiciousFlag,
  listBlockedDomains,
  addBlockedDomain,
  removeBlockedDomain,
  getEmailLogo,
  uploadEmailLogo,
} from "../controllers/admin.controller.js";
import { getAuthSettings, updateAuthSettings } from "../controllers/authSetting.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/stats", getAdminStats);

router.get("/auth-settings", getAuthSettings);
router.put("/auth-settings", updateAuthSettings);

router.get("/users", listUsers);
router.patch("/users/:id/active", setUserActive);

router.get("/reports", listReports);
router.patch("/reports/:id", resolveReport);

router.patch("/pages/:id/block", blockPage);
router.delete("/pages/:id", deletePage);

router.get("/links/suspicious", listSuspiciousLinks);
router.patch("/links/:id/clear-flag", clearSuspiciousFlag);

router.get("/blocked-domains", listBlockedDomains);
router.post("/blocked-domains", addBlockedDomain);
router.delete("/blocked-domains/:id", removeBlockedDomain);

// ---- Branding ----
router.get("/branding/logo", getEmailLogo);
router.post("/branding/logo", upload.single("logo"), uploadEmailLogo);

export default router;

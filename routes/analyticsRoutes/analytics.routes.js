import express from "express";
import { getAnalyticsDashboard } from "../../controllers/analytics/analytics.controller.js";
import {
  authenticate,
  ensureCompanyAccess,
  requirePermission,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.get(
  "/overview",
  requirePermission("analytics:read"),
  getAnalyticsDashboard
);

export default router;

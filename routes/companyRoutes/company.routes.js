import express from "express";
import {
  authenticate,
  ensureCompanyAccess,
  requireAdminAccess,
  requireManagerialRole,
  requirePermission,
} from "../../middlewares/auth.middleware.js";
import {
  deleteCompany,
  getCompanyDetails,
  updateCompanyDetails,
} from "../../controllers/company/company.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);


router.get("/details", requireManagerialRole,requirePermission("company:read"), getCompanyDetails);
router.patch("/update", requireAdminAccess,requirePermission("company:update"), updateCompanyDetails);
router.delete("/delete", requireAdminAccess,requirePermission("company:delete"), deleteCompany);


export default router;

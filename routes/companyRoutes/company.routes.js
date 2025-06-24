import express from "express";
import {
  authenticate,
  ensureCompanyAccess,
  requireAdminAccess,
  requireManagerialRole,
} from "../../middlewares/auth.middleware.js";
import {
  deleteCompany,
  getCompanyDetails,
  updateCompanyDetails,
} from "../../controllers/company/company.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.get("/details", requireManagerialRole, getCompanyDetails);

router.patch("/update", requireAdminAccess, updateCompanyDetails);

router.delete("/delete", requireAdminAccess, deleteCompany);

export default router;

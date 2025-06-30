import express from "express";
import {
  authenticate,
  ensureCompanyAccess,
  requireManagerialRole,
  requirePermission,
  requireSeniorRole,
} from "../../middlewares/auth.middleware.js";
import {
  addDesignation,
  deleteDesignation,
  getAllDesignationsByDepartment,
  getDesignationById,
  updateDesignation,
} from "../../controllers/designation/designation.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.post("/addDesignation", requirePermission("designation:manage"), addDesignation);
router.get("/", requirePermission("designation:read"), getAllDesignationsByDepartment);
router.get("/:id", requirePermission("designation:read"), getDesignationById);
router.patch("/:id", requireManagerialRole, requirePermission("designation:manage"), updateDesignation);
router.delete("/:id", requireSeniorRole, requirePermission("designation:manage"), deleteDesignation);

export default router;
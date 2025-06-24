import express from "express";
import {
  authenticate,
  ensureCompanyAccess,
  requireManagerialRole,
  requirePermission,
  requireSeniorRole,
} from "../../middlewares/auth.middleware.js";
import {
  addDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
} from "../../controllers/department/department.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.post("/", requirePermission("department:manage"), addDepartment);

router.get("/", requirePermission("department:read"), getAllDepartments);

router.get("/:id", requirePermission("department:read"), getDepartmentById);

router.patch(
  "/:id",
  requireManagerialRole,
  requirePermission("department:manage"),
  updateDepartment
);

router.delete(
  "/:id",
  requireSeniorRole,
  requirePermission("department:manage"),
  deleteDepartment
);

export default router;

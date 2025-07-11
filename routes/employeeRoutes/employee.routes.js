import express from "express";
import {
  authenticate,
  ensureCompanyAccess,
  ensureSelfOrManagerialAccess,
  requireManagerialRole,
  requireSeniorRole,
  requirePermission
} from "../../middlewares/auth.middleware.js";
import {
  deleteEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeStats,
 
  updateProfilePic,
  updateBasicDetails, updateSalary, updateRole
} from "../../controllers/employee/employee.management.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.get("/", requirePermission("employee:read"), getAllEmployees);

router.get(
  "/stats",
  requireManagerialRole,
  requirePermission("employee:read"),
  getEmployeeStats
);

router.get(
  "/:id",
  requirePermission("employee:read"),
  ensureSelfOrManagerialAccess,
  getEmployeeById
);


router.patch("/:id/basic", requirePermission("employee:update:basic"), ensureSelfOrManagerialAccess, updateBasicDetails);
router.patch("/:id/salary", requirePermission("employee:update:salary"), ensureSelfOrManagerialAccess, updateSalary);
router.patch("/:id/role", requirePermission("employee:manage"), ensureSelfOrManagerialAccess, updateRole);

router.delete(
  "/:id",
  requireSeniorRole,
  requirePermission("employee:manage"),
  deleteEmployee
);

router.patch(
  "/:id/profile-pic",
  ensureSelfOrManagerialAccess,
  upload.single("profilePic"),
  updateProfilePic
);

export default router;

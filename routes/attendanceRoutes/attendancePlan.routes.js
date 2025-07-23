import express from "express";
import {
  createAttendancePlan,
  deleteAttendancePlan,
  getAllAttendancePlans,
  updateAttendancePlan,
} from "../../controllers/attendance/attendancePlan.controller.js";
import {
  authenticate,
  ensureCompanyAccess,
  requirePermission,
  requireAdminAccess,
  requireManagerialRole,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.get(
  "/",
  requireManagerialRole,
  requirePermission("attendancePlan:read"),
  getAllAttendancePlans
);

router.post(
  "/",
  requirePermission("attendancePlan:manage"),
  createAttendancePlan
);

router.patch(
  "/:planId",
  requirePermission("attendancePlan:manage"),
  updateAttendancePlan
);

router.delete(
  "/:planId",
  requirePermission("attendancePlan:manage"),
  deleteAttendancePlan
);

export default router;

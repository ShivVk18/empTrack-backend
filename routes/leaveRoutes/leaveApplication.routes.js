import express from "express";
import {
  applyLeave,
  updateLeaveStatus,
  getAllLeaveApplications,
  getMyLeaveApplications,
} from "../../controllers/leaveControllers/leaveApplication.controller.js";

import {
  authenticate,
  ensureCompanyAccess,
  requirePermission,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

// 🟢 Apply for Leave - Only employees (permission: "leave:apply")
router.post(
  "/",
  requirePermission("leave:apply"),
  applyLeave
);

// 🟢 Get All Leave Applications - Only HR, SR_MANAGER, ADMIN (permission: "leave:manage")
router.get(
  "/",
  requirePermission("leave:manage"),
  getAllLeaveApplications
);

// 🟢 Update Leave Status - Only HR, SR_MANAGER (permission: "leave:manage")
router.put(
  "/:leaveId",
  requirePermission("leave:manage"),
  updateLeaveStatus
);

// 🟢 Get My Leave Applications - Only employees (permission: "leave:view_own")
router.get(
  "/my",
  requirePermission("leave:view_own"),
  getMyLeaveApplications
);

export default router;
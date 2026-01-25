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


router.post(
  "/",
  requirePermission("leave:apply"),
  applyLeave
);


router.get(
  "/",
  requirePermission("leave:manage"),
  getAllLeaveApplications
);



router.put(
  "/:leaveId",
  requirePermission("leave:manage"),
  updateLeaveStatus
);


router.get(
  "/my",
  requirePermission("leave:view_own"),
  getMyLeaveApplications
);

export default router;
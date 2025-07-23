import express from "express";
import {
  createLeavePolicy,
  updateLeavePolicy,
  getAllLeavePolicy,
  deleteLeavePolicy,
} from "../../controllers/leaveControllers/leavePolicy.controller.js";

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
  requirePermission("leave-policy:manage"),
  createLeavePolicy
);


router.get(
  "/",
  requirePermission("leave-policy:manage"),
  getAllLeavePolicy
);

// 🟢 Update Leave Policy - Only Admin or HR (permission: "leave-policy:manage")
router.put(
  "/:leavePolicyId",
  requirePermission("leave-policy:manage"),
  updateLeavePolicy
);

// 🟢 Delete Leave Policy - Only Admin or HR (permission: "leave-policy:manage")
router.delete(
  "/:leavePolicyId",
  requirePermission("leave-policy:manage"),
  deleteLeavePolicy
);

export default router;
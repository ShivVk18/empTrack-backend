import express from "express";
import {
  createLeavePolicy,
  updateLeavePolicy,
  getAllLeavePolicy,
  deleteLeavePolicy,
  getLeavePolicyById,
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
  getAllLeavePolicy
);  

router.get(
     "/:leavePolicyId",
 
  getLeavePolicyById
)


router.patch(
  "/:leavePolicyId",
  requirePermission("leave-policy:manage"),
  updateLeavePolicy
);


router.delete(
  "/:leavePolicyId",
  requirePermission("leave-policy:manage"),
  deleteLeavePolicy
);

export default router;
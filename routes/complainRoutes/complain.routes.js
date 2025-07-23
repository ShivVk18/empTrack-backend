import express from "express";
import {
  raiseComplaint,
  getAllComplaints,
  updateComplaint,
  getOwnComplaints,
} from "../../controllers/complain/complain.controller.js";

import {
  authenticate,
  ensureCompanyAccess,
  requirePermission,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.post("/", requirePermission("complain:raise"), raiseComplaint);

router.get("/", requirePermission("complain:read"), getAllComplaints);

router.patch(
  "/:complaintId",
  requirePermission("complain:manage"),
  updateComplaint
);

router.get("/own", requirePermission("complain:read:own"), getOwnComplaints);

export default router;

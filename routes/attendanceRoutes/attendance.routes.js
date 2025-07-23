import express from "express";
import { clockIn, clockOut, getAllAttendance, getOwnAttendance } from "../../controllers/attendance/attendance.controller.js";
import { authenticate, ensureCompanyAccess, requireManagerialRole, requirePermission } from "../../middlewares/auth.middleware.js";

const router = express.Router();


router.use(authenticate);
router.use(ensureCompanyAccess);


router.post("/clockin", requirePermission("attendance:clockin"), clockIn);

router.post("/clockout", requirePermission("attendance:clockout"), clockOut);

router.get("/own", requirePermission("attendance:read:own"), getOwnAttendance);

router.get("/", requireManagerialRole, requirePermission("attendance:read"), getAllAttendance);

export default router;
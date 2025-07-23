import express from "express";
import {
  createHoliday,
  getAllHoliday,
  deleteHoliday,
} from "../../controllers/holiday/holiday.controller.js";

import {
  authenticate,
  ensureCompanyAccess,
  requirePermission,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.post("/", requirePermission("holiday:manage"), createHoliday);

router.get("/", requirePermission("holiday:read"), getAllHoliday);

router.delete(
  "/:holidayId",
  requirePermission("holiday:manage"),
  deleteHoliday
);

export default router;

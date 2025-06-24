import express from "express";
import {
  sendPasswordResetEmail,
  sendPayslipEmails,
} from "../../controllers/email/email.controller.js";
import {
  authenticate,
  ensureCompanyAccess,
  requireFinancialRole,
  requirePermission,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/password-reset", sendPasswordResetEmail);

router.use(authenticate);
router.use(ensureCompanyAccess);

router.post(
  "/payslips",
  requireFinancialRole,
  requirePermission("payroll:manage"),
  sendPayslipEmails
);

export default router;

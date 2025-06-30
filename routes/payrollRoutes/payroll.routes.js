import express from "express";
import {
  authenticate,
  ensureCompanyAccess,
  requireFinancialRole,
  requireManagerialRole,
  requirePermission,
  requireSeniorRole,
} from "../../middlewares/auth.middleware.js";
import {
  generateSalary,
  getEmployeeSalaries,
  updateSalary,
} from "../../controllers/payroll/payrollManagement.controller.js";
import {
  createPayParameter,
  deletePayparameter,
  getPayParameters,
  getPayParametersByType,
  updatePayParameter,
} from "../../controllers/payroll/payparameter.controller.js";
import { getSalarySummary } from "../../controllers/payroll/payrollAnalytics.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.post(
  "/generate",
  requireFinancialRole,
  requirePermission("payroll:manage"),
  generateSalary
);


router.get("/salaries", requirePermission("payroll:read"), getEmployeeSalaries);

router.patch(
  "/salary/:payMasterId",
  requireFinancialRole,
  requirePermission("payroll:manage"),
  updateSalary
);
router.post(
  "/parameters",
  requireFinancialRole,
  requirePermission("payparameter:manage"),
  createPayParameter
);
router.get(
  "/parameters",
  requirePermission("payparameter:read"),
  getPayParameters
);
router.get(
  "/parameter/:employeeType",
  requirePermission("payparameter:read"),
  getPayParametersByType
);

router.patch(
  "/parameters/:id",
  requireFinancialRole,
  requirePermission("payparameter:manage"),
  updatePayParameter
);

router.delete(
  "/parameters/:id",
  requireSeniorRole,
  requireFinancialRole,
  requirePermission("payparameter:manage"),
  deletePayparameter
);


router.get(
  "/analytics/summary",
  requireManagerialRole,
  requirePermission("analytics:read"),
  getSalarySummary
);

export default router;

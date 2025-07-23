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
 deletePayParameter,
  getPayParameters,
  getPayParametersByType,
  updatePayParameter,
  getPayParameterById
} from "../../controllers/payroll/payparameter.controller.js";
import { getSalarySummary } from "../../controllers/payroll/payrollAnalytics.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(ensureCompanyAccess);

router.post("/parameters/add", requireFinancialRole, requirePermission("payparameter:manage"), createPayParameter);
router.get("/parameters", requirePermission("payparameter:read"), getPayParameters);
router.get("/parameters/:id", requirePermission("payparameter:read"), getPayParameterById);
router.get("/parameters/type/:employeeType", requirePermission("payparameter:read"), getPayParametersByType);
router.patch("/parameters/:id", requireFinancialRole, requirePermission("payparameter:manage"), updatePayParameter);
router.delete("/parameters/:id", requireSeniorRole, requireFinancialRole, requirePermission("payparameter:manage"), deletePayParameter);

router.post("/salaries/generate", requireFinancialRole, requirePermission("payroll:manage"), generateSalary);
router.get("/salaries", requirePermission("payroll:read"), getEmployeeSalaries);
router.patch("/salaries/:payMasterId", requireFinancialRole, requirePermission("payroll:manage"), updateSalary);


router.get("/analytics/salary-summary", requireManagerialRole, requirePermission("analytics:read"), getSalarySummary);

export default router;

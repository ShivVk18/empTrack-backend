import express from 'express'
import authRoutes from './authRoutes/auth.routes.js'
import companyRoutes from './companyRoutes/company.routes.js'
import departmentRoutes  from './departmentRoutes/department.routes.js'
import designationRoutes from './designationRoutes/designation.routes.js'
import emailRoutes from './emailRoutes/email.routes.js'
import employeeRoutes from './employeeRoutes/employee.routes.js'
import locationRoutes from './locationRoutes/location.routes.js'
import payrollRoutes from './payrollRoutes/payroll.routes.js'


const router = express.Router()

router.use("/api/v1/auth",authRoutes)
router.use("/api/v1/company",companyRoutes)
router.use("/api/v1/department",departmentRoutes)
router.use("/api/v1/designation",designationRoutes)
router.use("/api/v1/email",emailRoutes)
router.use("/api/v1/employee",employeeRoutes)
router.use("/api/v1/payroll",payrollRoutes)

export default router


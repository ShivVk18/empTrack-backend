import express from 'express'
import authRoutes from './authRoutes/auth.routes.js'
import companyRoutes from './companyRoutes/company.routes.js'
import departmentRoutes  from './departmentRoutes/department.routes.js'
import designationRoutes from './designationRoutes/designation.routes.js'
import emailRoutes from './emailRoutes/email.routes.js'
import employeeRoutes from './employeeRoutes/employee.routes.js'
import payrollRoutes from './payrollRoutes/payroll.routes.js'
import holidayRoutes from './holidayRoutes/holiday.routes.js'
import complainRoutes from './complainRoutes/complain.routes.js'
import leaveApplicationRoutes from './leaveRoutes/leaveApplication.routes.js'
import leavePolicyRoutes from './leaveRoutes/leavePolicy.routes.js'
import attendanceRoutes from './attendanceRoutes/attendance.routes.js'
import attendancePlanRoutes from './attendanceRoutes/attendancePlan.routes.js'

const router = express.Router()

router.use("/api/v1/auth",authRoutes)
router.use("/api/v1/company",companyRoutes)
router.use("/api/v1/department",departmentRoutes)
router.use("/api/v1/designation",designationRoutes)
router.use("/api/v1/email",emailRoutes)
router.use("/api/v1/employee",employeeRoutes)
router.use("/api/v1/payroll",payrollRoutes)
router.use("/api/v1/holiday",holidayRoutes)
router.use("/api/v1/complain",complainRoutes)
router.use("/api/v1/leaveApplication",leaveApplicationRoutes)
router.use("/api/v1/leavePolicy",leavePolicyRoutes)
router.use("/api/v1/attendance",attendanceRoutes)
router.use("/api/v1/attendancePlan",attendancePlanRoutes)



export default router


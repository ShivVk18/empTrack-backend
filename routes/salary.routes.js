import express from 'express'
import { verifyEmployeeJwt } from '../middlewares/auth.middleware.js'
import { getEmployeeSalary, getEmployeeSalaryByMonthAndYear } from '../controllers/paymaster.controller.js'


const router = express.Router()

router.route('/getSalary').get(verifyEmployeeJwt,getEmployeeSalary)
router.route('/getSalary/byMonthAndYear').get(verifyEmployeeJwt,getEmployeeSalaryByMonthAndYear) 

export default router
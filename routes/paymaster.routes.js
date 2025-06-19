import express from 'express'
import { verifyAdminJwt } from '../middlewares/auth.middleware.js'
import { generateSalary } from '../controllers/paymaster.controller.js'




const router = express.Router()
router.route('/paymaster/generateSalaries').post(verifyAdminJwt,generateSalary)






export default router
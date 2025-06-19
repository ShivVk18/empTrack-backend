import express from 'express'
import { verifyAdminJwt } from '../middlewares/auth.middleware.js'
import { createPayParameter, deletePayparameter, getPayParameters } from '../controllers/payparameter.controller.js'

const router = express.Router()

router.route('/createPayparameter').post(verifyAdminJwt,createPayParameter)
router.route('/getPayParameters').get(verifyAdminJwt,getPayParameters)
router.route('/deletePayparameter/delete').delete(verifyAdminJwt,deletePayparameter)


export default router



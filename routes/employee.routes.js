import express from 'express';
import { verifyEmployeeJwt } from '../middlewares/auth.middleware.js'; 
import { changeEmployeePassword, viewProfile } from '../controllers/employee.controller.js';
import { employeeLogin, employeeLogout } from '../controllers/employeeAuth.controller.js';

const router = express.Router();

router.route('/login').post(employeeLogin);
router.route('/logout').post(verifyEmployeeJwt,employeeLogout);
router.route('/viewProfile').get(verifyEmployeeJwt,viewProfile);
router.route('/changePassword').post(verifyEmployeeJwt, changeEmployeePassword)


export default router;
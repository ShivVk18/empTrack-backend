import express from 'express';
import { verifyAdminJwt } from '../middlewares/auth.middleware.js';
import { addDepartment ,getAllDepartments,deleteDepartment } from '../controllers/department.controller.js';
const router = express.Router();

router.route('/department/adddepartment').post(verifyAdminJwt, addDepartment);
router.route('/department/getalldepartments').get(verifyAdminJwt, getAllDepartments);
router.route('/department/deletedepartment/:code').delete(verifyAdminJwt, deleteDepartment);


export default router; 
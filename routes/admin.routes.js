import express from 'express';
import { verifyAdminJwt } from '../middlewares/auth.middleware.js';
import { adminLogin, adminLogOut, adminSignUp, refreshAdminAccessToken } from '../controllers/auth.controller.js';
import { deleteCompany, updateAdminPassword, updateAdminProfile, updateCompanyDetails } from '../controllers/admin.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import { addEmployee } from '../controllers/employeeAuth.controller.js';
import { advEmpFilter, deleteEmployee, findEmployeeUsingEmployeeCode, findEmployeeUsingEmployeeName, getAllEmployees, updateEmployeeDetails, updateEmployeeProfilePic } from '../controllers/employee.controller.js';
const router = express.Router();

router.route('/adminregister').post(adminSignUp);
router.route('/adminlogin').post(adminLogin)
router.route('/adminlogout').post(verifyAdminJwt,adminLogOut)
router.route('/refresh-admin-access-token').post(refreshAdminAccessToken)
router.route('/updateadminpassword').post(verifyAdminJwt, updateAdminPassword);
router.route('/updateadminprofile').post(verifyAdminJwt, updateAdminProfile);
router.route('/company/updatecompanydetails').post(verifyAdminJwt, updateCompanyDetails);
router.route('/company/deletecompany').post(verifyAdminJwt, deleteCompany);
router.route('/employee/addEmployee').post(verifyAdminJwt,upload.single('profilePic'), addEmployee)
router.route('/employee/getAllEmployees').get(verifyAdminJwt,getAllEmployees)
router.route('/employee/deleteEmployee/:id').delete(verifyAdminJwt,deleteEmployee)
router.route('/employee/updateEmployee/:id').put(verifyAdminJwt,updateEmployeeDetails);
router.route('/employee/updateEmployeeProfile/:id').put(verifyAdminJwt,upload.single('profilePic'),updateEmployeeProfilePic)
router.route('/employee/findByCode').get(verifyAdminJwt, findEmployeeUsingEmployeeCode); 
router.route('/employee/findByName').get(verifyAdminJwt, findEmployeeUsingEmployeeName);
router.get('/employees/filter', verifyAdminJwt, advEmpFilter);

export default router
import express from 'express';
import { verifyAdminJwt } from '../middlewares/auth.middleware';
import { adminLogin, adminLogOut, adminSignUp, refreshAdminAccessToken } from '../controllers/auth.controller';
import { deleteCompany, updateAdminPassword, updateAdminProfile, updateCompanyDetails } from '../controllers/admin.controller';
const router = express.Router();

router.route('/adminregister').post(adminSignUp);
router.route('/adminlogin').post(adminLogin)
router.route('/adminlogout').post(verifyAdminJwt,adminLogOut)
router.route('refresh-admin-access-token').post(refreshAdminAccessToken)
router.route('/updateadminpassword').post(verifyAdminJwt, updateAdminPassword);
router.route('/updateadminprofile').post(verifyAdminJwt, updateAdminProfile);
router.route('/updatecompanydetails').post(verifyAdminJwt, updateCompanyDetails);
router.route('/deletecompany').post(verifyAdminJwt, deleteCompany);

export default router
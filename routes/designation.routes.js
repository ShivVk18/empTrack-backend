import express from 'express'; 
import { verifyAdminJwt } from '../middlewares/auth.middleware.js';
import { addDesignation ,getAllDesignations, deleteDesignation } from '../controllers/designation.controller.js';
const router = express.Router();

router.route('/designation/adddesignation').post(verifyAdminJwt, addDesignation);
router.route('/designation/getalldesignations').get(verifyAdminJwt, getAllDesignations);
router.route('/designation/deletedesignation/:code').delete(verifyAdminJwt, deleteDesignation);

export default router;
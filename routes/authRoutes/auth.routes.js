import express from "express";
import {
  addEmployee,
  adminSignUp,
  changePassword,
  getProfile,
  logoutHandler,
  refreshAccessToken,
  universalLogin,
} from "../../controllers/auth/universal.auth.controller.js";
import {
  resendOTP,
  sendLoginOTP,
  verifyLoginOtp,
} from "../../controllers/auth/otp.controller.js";
import {
  authenticate,
  ensureCompanyAccess,
  ensureSelfOrManagerialAccess,
  requirePermission,
} from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/admin/signup", adminSignUp);
router.post("/login", universalLogin);
// router.post("/otp/send", sendLoginOTP);
// router.post("/otp/verify", verifyLoginOtp);
// router.post("/otp/resend", resendOTP);
router.post("/refresh-token", refreshAccessToken);


router.use(authenticate);
router.use(ensureCompanyAccess);

// Employee Management
router.post(
  "/employee/add",
  requirePermission("employee:manage"),
  upload.single("profilePic"),
  addEmployee
); 


router.get("/profile", getProfile);
router.post("/logout", logoutHandler);
router.patch("/change-password", ensureSelfOrManagerialAccess, changePassword);
export default router;

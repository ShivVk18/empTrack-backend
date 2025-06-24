import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import {
  isOTPExpired,
  generateOTP,
  sendOTP,
  isValidOTPFormat,
  generateOTPExpiry,
  sendOTPSMS,
} from "../../utils/otp.utils.js";

import {
  generateTokens,
  getCookieOptions,
  updateRefreshToken,
} from "../../utils/auth.utils.js";

const sendLoginOTP = asyncHandler(async (req, res) => {
  const { userId, userType, method = "email" } = req.body;

  if (!userId || !userType) {
    throw new ApiError(400, "User ID and user type are required");
  }

  if (!["admin", "employee"].includes(userType)) {
    throw new ApiError(400, "Invalid user type");
  }

  if (!["email", "sms", "both"].includes(method)) {
    throw new ApiError(400, "Invalid OTP delivery method");
  }

  let user = null;

  if (userType === "admin") {
    user = await prisma.admin.findUnique({
      where: { id: Number.parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        otpAttemps: true,
      },
    });
  } else {
    user = await prisma.employee.findUnique({
      where: { id: Number.parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNo: true,
        otpAttemps: true,
        isActive: true,
      },
    });
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (userType === "employee" && !user.isActive) {
    throw new ApiError(403, "Employee account is inactive");
  }

  if (user.otpAttemps >= 5) {
    throw new ApiError(
      429,
      "Too many OTP requests. Please try again after 1 hour."
    );
  }

  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  const updateData = {
    otp,
    otpExpiry,
    isOtpVerified: false,
    otpAttemps: user.otpAttemps + 1,
  };

  if (userType === "admin") {
    await prisma.admin.update({
      where: { id: user.id },
      data: updateData,
    });
  } else {
    await prisma.employee.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  //send OTP
  const results = [];

  if (method === "email" || method === "both") {
    const emailResult = await sendOTPEmail(user.email, otp, user.name);
    results.push({ type: "email", ...emailResult });
  }

  if (method === "sms" || method === "both") {
    const mobile = userType === "admin" ? user.mobile : user.mobileNo;
    const smsResult = await sendOTPSMS(mobile, otp, user.name);
    results.push({ type: "sms", ...smsResult });
  }

  const hasSuccess = results.some((result) => result.success);

  if (!hasSuccess) {
    throw new ApiError(500, "Failed to send OTP via any method");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userId: user.id,
        userType,
        otpSent: true,
        deliveryMethods: results,
        expiredIn: "5 Minutes",
      },
      "OTP sent successfully"
    )
  );
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { userId, userType, otp } = req.body;

  if (!userId || !userType || !otp) {
    throw new ApiError(400, "User ID, user type, and OTP are required");
  }

  if (!isValidOTPFormat(otp)) {
    throw new ApiError(400, "Invalid OTP format. OTP must be 6 digits.");
  }

  let user = null;
  if (userType === "admin") {
    user = await prisma.admin.findUnique({
      where: { id: Number.parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        companyId: true,
        otp: true,
        otpExpiry: true,
        isOtpVerified: true,
        otpAttemps: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
      },
    });
  } else {
    user = await prisma.employee.findUnique({
      where: { id: Number.parseInt(userId) },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        mobileNo: true,
        role: true,
        type: true,
        companyId: true,
        isActive: true,
        otp: true,
        otpExpiry: true,
        isOtpVerified: true,
        otpAttemps: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        department: {
          select: { name: true },
        },
        designation: {
          select: { name: true },
        },
      },
    });
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (userType === "employee" && !user.isActive) {
    throw new ApiError(403, "Employee account is inactive");
  }

  if (!user.otp || !user.otpExpiry) {
    throw new ApiError(400, "No OTP found. Please request a new OTP.");
  }

  if (isOTPExpired(user.otpExpiry)) {
    throw new ApiError(400, "OTP has expired. Please request a new OTP.");
  }

  if (user.otp !== otp) {
    const updateData = { otpAttemps: user.otpAttemps + 1 };

    if (userType === "admin") {
      await prisma.admin.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      await prisma.employee.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    throw new ApiError(400, "Invalid OTP");
  }

  const { accessToken, refreshToken } = await generateTokens(user, userType);
  await updateRefreshToken(user.id, refreshToken, userType);

  const clearOTPData = {
    otp: null,
    otpExpiry: null,
    isOtpVerified: true,
    otpAttemps: 0,
  };

  if (userType === "admin") {
    await prisma.admin.update({
      where: { id: user.id },
      data: clearOTPData,
    });
  } else {
    await prisma.employee.update({
      where: { id: user.id },
      data: clearOTPData,
    });
  }

  const {
    otp: _,
    otpExpiry: __,
    isOtpVerified: ___,
    otpAttempts: ____,
    ...userWithoutOTP
  } = user;
  const cookieOptions = getCookieOptions();

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: userWithoutOTP,
          userType,
          accessToken,
          refreshToken,
        },
        `${userType === "employee" ? "Employee" : "Admin"} logged in successfully`
      )
    );
});

const resendOTP = asyncHandler(async (req, res) => {
  const { userId, userType, method = "email" } = req.body;

  if (!userId || !userType) {
    throw new ApiError(400, "User ID and user type are required");
  }

  let user = null;
  if (userType === "admin") {
    user = await prisma.admin.findUnique({
      where: { id: Number.parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        otpExpiry: true,
        otpAttempts: true,
      },
    });
  } else {
    user = await prisma.employee.findUnique({
      where: { id: Number.parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNo: true,
        otpExpiry: true,
        otpAttempts: true,
        isActive: true,
      },
    });
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (userType === "employee" && !user.isActive) {
    throw new ApiError(403, "Employee account is inactive");
  }

  if (
    user.otpExpiry &&
    new Date() < new Date(user.otpExpiry.getTime() - 4 * 60 * 1000)
  ) {
    throw new ApiError(429, "Please wait before requesting a new OTP");
  }

  if (user.otpAttemps >= 5) {
    throw new ApiError(
      429,
      "Too many OTP requests. Please try again after 1 hour."
    );
  }

  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  const updateData = {
    otp,
    otpExpiry,
    isOtpVerified: false,
    otpAttemps: user.otpAttemps + 1,
  };

  if (userType === "admin") {
    await prisma.admin.update({
      where: { id: user.id },
      data: updateData,
    });
  } else {
    await prisma.employee.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  const results = [];

  if (method === "email" || method === "both") {
    const emailResult = await sendOTPEmail(user.email, otp, user.name);
    results.push({ type: "email", ...emailResult });
  }

  if (method === "sms" || method === "both") {
    const mobile = userType === "admin" ? user.mobile : user.mobileNo;
    const smsResult = await sendOTPSMS(mobile, otp, user.name);
    results.push({ type: "sms", ...smsResult });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userId: user.id,
        userType,
        otpSent: true,
        deliveryMethods: results,
        expiresIn: "5 minutes",
      },
      "New OTP sent successfully"
    )
  );
});

export { sendLoginOTP, verifyLoginOtp, resendOTP };

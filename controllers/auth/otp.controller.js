import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import {
  isOTPExpired,
  generateOTP,
  isValidOTPFormat,
  generateOTPExpiry,
  sendOTPEmail,
} from "../../utils/otp.utils.js";

import {
  generateTokens,
  getCookieOptions,
  updateRefreshToken,
} from "../../utils/auth.utils.js";

const sendLoginOTP = asyncHandler(async (req, res) => {
  const { userId, userType } = req.body;

  if (!userId || !userType) {
    throw new ApiError(400, "User ID and user type are required");
  }

  if (!["admin", "employee"].includes(userType)) {
    throw new ApiError(400, "Invalid user type");
  }

  let user = null;

  if (userType === "admin") {
    user = await prisma.admin.findUnique({
      where: { id: Number.parseInt(userId) },
      select: { id: true, name: true, email: true, otpAttempts: true, otpBlockedUntil: true },
    });
  } else {
    user = await prisma.employee.findUnique({
      where: { id: Number.parseInt(userId) },
      select: { id: true, name: true, email: true, otpAttempts: true, isActive: true, otpBlockedUntil: true },
    });
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (userType === "employee" && !user.isActive) {
    throw new ApiError(403, "Employee account is inactive");
  }

  if (user.otpBlockedUntil && new Date() < new Date(user.otpBlockedUntil)) {
    throw new ApiError(429, "Too many OTP requests. Please try again after 1 hour.");
  }

  if (user.otpBlockedUntil && new Date() >= new Date(user.otpBlockedUntil)) {
    await prisma[userType].update({
      where: { id: user.id },
      data: { otpAttempts: 0, otpBlockedUntil: null },
    });
    user.otpAttempts = 0;
    user.otpBlockedUntil = null;
  }

  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  await prisma[userType].update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiry,
      isOtpVerified: false,
      otpAttempts: user.otpAttempts + 1,
    },
  });

  const emailResult = await sendOTPEmail(user.email, otp, user.name);

  if (!emailResult.success) {
    throw new ApiError(500, "Failed to send OTP via email");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      userId: user.id,
      userType,
      otpSent: true,
      expiresIn: "5 minutes",
    }, "OTP sent successfully")
  );
});


const verifyLoginOtp = asyncHandler(async (req, res) => {
  try {
    const { userId, userType, otp } = req.body;
    console.log("Extracted values:", { userId, userType, otp });

    if (!userId || !userType || !otp) {
      console.log("Missing required fields");
      throw new ApiError(400, "User ID, user type, and OTP are required");
    }

    if (!isValidOTPFormat(otp)) {
      console.log("Invalid OTP format");
      throw new ApiError(400, "Invalid OTP format. OTP must be 6 digits.");
    }

    let user = null;
    if (userType === "admin") {
      console.log("Querying admin...");
      user = await prisma.admin.findUnique({
        where: { id: Number.parseInt(userId) },
        select: {
          id: true,
          name: true,
          email: true,
          mobileNo: true,
          companyId: true,
          otp: true,
          otpExpiry: true,
          isOtpVerified: true,
          otpAttempts: true,
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
          otpAttempts: true,
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
      console.log("User not found");
      throw new ApiError(404, "User not found");
    }

    if (userType === "employee" && !user.isActive) {
      console.log("Employee inactive");
      throw new ApiError(403, "Employee account is inactive");
    }

    if (user.otpBlockedUntil && new Date() < new Date(user.otpBlockedUntil)) {
      throw new ApiError(429, "Too many failed attempts. Please try again after 1 hour.");
    }

    if (!user.otp || !user.otpExpiry) {
      console.log("No OTP found");
      throw new ApiError(400, "No OTP found. Please request a new OTP.");
    }

    if (isOTPExpired(user.otpExpiry)) {
      console.log("OTP expired");
      throw new ApiError(400, "OTP has expired. Please request a new OTP.");
    }

    if (user.otp !== otp) {
      const updateData = { otpAttempts: user.otpAttempts + 1 };

      if (updateData.otpAttempts >= 5) {
        updateData.otpBlockedUntil = new Date(Date.now() + 60 * 60 * 1000);
      }

      if (userType === "admin") {
        console.log("About to update admin attempts...");
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
      otpAttempts: 0,
      otpBlockedUntil: null,
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

    console.log("Sending successful response...");
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
  } catch (error) {
    throw error;
  }
});

const resendOTP = asyncHandler(async (req, res) => {
  const { userId, userType, method = "email" } = req.body;

  if (!userId || !userType) {
    throw new ApiError(400, "User ID and user type are required");
  }

  if (method !== "email") {
    throw new ApiError(400, "Only email delivery method is supported");
  }

  let user = null;
  if (userType === "admin") {
    user = await prisma.admin.findUnique({
      where: { id: Number.parseInt(userId) },
      select: { id: true, name: true, email: true, otpExpiry: true, otpAttempts: true, otpBlockedUntil: true },
    });
  } else {
    user = await prisma.employee.findUnique({
      where: { id: Number.parseInt(userId) },
      select: { id: true, name: true, email: true, otpExpiry: true, otpAttempts: true, isActive: true, otpBlockedUntil: true },
    });
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (userType === "employee" && !user.isActive) {
    throw new ApiError(403, "Employee account is inactive");
  }

  if (user.otpBlockedUntil && new Date() < new Date(user.otpBlockedUntil)) {
    throw new ApiError(429, "Too many OTP requests. Please try again after 1 hour.");
  }

  if (user.otpBlockedUntil && new Date() >= new Date(user.otpBlockedUntil)) {
    await prisma[userType].update({
      where: { id: user.id },
      data: { otpAttempts: 0, otpBlockedUntil: null },
    });
    user.otpAttempts = 0;
    user.otpBlockedUntil = null;
  }

  if (user.otpExpiry && new Date() < new Date(user.otpExpiry.getTime() - 4 * 60 * 1000)) {
    throw new ApiError(429, "Please wait before requesting a new OTP");
  }

  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  await prisma[userType].update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiry,
      isOtpVerified: false,
      otpAttempts: user.otpAttempts + 1,
    },
  });

  const emailResult = await sendOTPEmail(user.email, otp, user.name);

  if (!emailResult.success) {
    throw new ApiError(500, "Failed to send OTP via email");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      userId: user.id,
      userType,
      otpSent: true,
      expiresIn: "5 minutes",
    }, "New OTP sent successfully")
  );
});

export { sendLoginOTP, verifyLoginOtp, resendOTP };
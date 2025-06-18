import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../config/prismaClient.js";

export const verifyAdminJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decodedToken._id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        companyId: true,
      },
      
    });

    if (!user) {
      throw new ApiError(401, "Unauthorized user");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export const verifyEmployeeJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const employee = await prisma.employee.findUnique({
      where: { id: decodedToken._id },
      select: {
        id: true,
        employeeCode: true,
        email: true,
        mobileNo: true,
        salary: true,
        companyId: true,
        isActive: true,
        cityId: true,
        stateId: true,
        profilePic: true,
        departmentId:true,
        designationId:true
      },
    });

    if (!employee) {
      throw new ApiError(401, "Unauthorized Employee");
    }

    req.employee = employee;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

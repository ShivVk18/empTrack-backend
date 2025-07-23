import prisma from "../../config/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


const createAttendancePlan = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const userType = req.userType;
  const userRole = req.user.role;

  if (userType !== "admin" || ["EMPLOYEE", "ACCOUNTANT", "MANAGER"].includes(userRole)) {
    throw new ApiError(403, "Only Admin and HR can create attendance plan");
  }

  const {
    name,
    description,
    workingHours,
    allowedLateMins,
    allowEarlyLeave,
    gracePeriodMins,
    requirePunchOut,
    isDefault,
    shiftStartTime,
  } = req.body;

  if (!name || !workingHours || !shiftStartTime) {
    throw new ApiError(400, "Name, Working Hours and Shift Start Time are required");
  }

  const existingPlan = await prisma.attendancePlan.findFirst({
    where: {
      companyId,
      name,
    },
  });

  if (existingPlan) {
    throw new ApiError(400, "Attendance Plan with same name already exists");
  }

  const newPlan = await prisma.attendancePlan.create({
    data: {
      companyId,
      name,
      description,
      workingHours,
      allowedLateMins: allowedLateMins || 0,
      allowEarlyLeave: allowEarlyLeave || false,
      gracePeriodMins: gracePeriodMins || 0,
      requirePunchOut: requirePunchOut || true,
      isDefault: isDefault || false,
      shiftStartTime,
    },
  });

  return res.status(201).json(new ApiResponse(201, newPlan, "Attendance Plan created successfully"));
});


const getAllAttendancePlans = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const { page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const attendancePlans = await prisma.attendancePlan.findMany({
    where: { companyId },
    skip,
    take: Number(limit),
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalRecords = await prisma.attendancePlan.count({
    where: { companyId },
  });

  return res.status(200).json(
    new ApiResponse(200, {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      records: attendancePlans,
    }, "Attendance Plans fetched successfully")
  );
});



const updateAttendancePlan = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const { planId } = req.params;
  const userType = req.userType;
  const userRole = req.user.role;

  if (userType !== "admin" || ["EMPLOYEE", "ACCOUNTANT", "MANAGER"].includes(userRole)) {
    throw new ApiError(403, "Only Admin and HR can update attendance plan");
  }

  const existingPlan = await prisma.attendancePlan.findUnique({
    where: { id: Number(planId) },
  });

  if (!existingPlan || existingPlan.companyId !== companyId) {
    throw new ApiError(404, "Attendance Plan not found");
  }

  const updateData = req.body;

  if (updateData.name) {
    const duplicate = await prisma.attendancePlan.findFirst({
      where: {
        companyId,
        name: updateData.name,
        NOT: { id: Number(planId) },
      },
    });

    if (duplicate) {
      throw new ApiError(400, "Another Attendance Plan with same name already exists");
    }
  }

  const updatedPlan = await prisma.attendancePlan.update({
    where: { id: Number(planId) },
    data: updateData,
  });

  return res.status(200).json(new ApiResponse(200, updatedPlan, "Attendance Plan updated successfully"));
});


const deleteAttendancePlan = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const { planId } = req.params;
  const userType = req.userType;
  const userRole = req.user.role;

  if (userType !== "admin" || ["EMPLOYEE", "ACCOUNTANT", "MANAGER"].includes(userRole)) {
    throw new ApiError(403, "Only Admin and HR can delete attendance plan");
  }

  const existingPlan = await prisma.attendancePlan.findUnique({
    where: { id: Number(planId) },
  });

  if (!existingPlan || existingPlan.companyId !== companyId) {
    throw new ApiError(404, "Attendance Plan not found");
  }

  await prisma.attendancePlan.delete({
    where: { id: Number(planId) },
  });

  return res.status(200).json(new ApiResponse(200, {}, "Attendance Plan deleted successfully"));
});


export {createAttendancePlan,deleteAttendancePlan,getAllAttendancePlans,updateAttendancePlan}

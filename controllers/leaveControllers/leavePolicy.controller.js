import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import prisma from "../../config/prismaClient";

const createLeavePolicy = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const userType = req.userType;
  const userRole = req.user.role;

 
  if (userType !== "admin" && userRole !== "HR") {
    throw new ApiError(403, "Only admin or HR can create leave policy");
  }

  const {
    leaveType,
    daysAllowed,
    carryForward,
    maxCarryForwardDays,
    isPaid,
    isActive,
  } = req.body;

  if (!leaveType || !daysAllowed) {
    throw new ApiError(400, "Leave type and allowed days must be provided");
  }

  if (
    carryForward === true &&
    (maxCarryForwardDays === undefined || maxCarryForwardDays === null)
  ) {
    throw new ApiError(
      400,
      "Max Carry Forward Days should be provided when carry forward is enabled"
    );
  }

  const duplicateLeavePolicy = await prisma.leavePolicy.findFirst({
    where: {
      companyId: companyId,
      leaveType: leaveType,
    },
  });

  if (duplicateLeavePolicy) {
    throw new ApiError(400, "Leave policy of same type already exists");
  }

  const newLeavePolicy = await prisma.leavePolicy.create({
    data: {
      companyId: companyId,
      leaveType: leaveType,
      daysAllowed: daysAllowed,
      carryForward: carryForward === true,
      maxCarryForwardDays: carryForward === true ? maxCarryForwardDays : 0,
      isPaid: isPaid !== false,
      isActive: isActive !== false,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newLeavePolicy,
        "New leave policy created successfully"
      )
    );
});

const getAllLeavePolicy = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const userType = req.userType;
  const userRole = req.user.role;

  if (userType !== "admin" && userRole !== "HR") {
    throw new ApiError(403, "Only admin or HR can view leave policies");
  }

  const { leaveType, isPaid, isActive, page = 1, limit = 10 } = req.query;

  const filters = {
    companyId: companyId,
  };

  if (leaveType) {
    filters.leaveType = { contains: leaveType, mode: "insensitive" };
  }

  if (isPaid !== undefined) {
    filters.isPaid = isPaid === "true";
  }

  if (isActive !== undefined) {
    filters.isActive = isActive === "true";
  }

  const skip = (Number(page) - 1) * Number(limit);

  const leavePolicies = await prisma.leavePolicy.findMany({
    where: filters,
    skip,
    take: Number(limit),
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalRecords = await prisma.leavePolicy.count({
    where: filters,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: Number(page),
        records: leavePolicies,
      },
      "Leave policies fetched successfully"
    )
  );
});

const deleteLeavePolicy = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const { leavePolicyId } = req.params;

  if (!leavePolicyId || isNaN(leavePolicyId)) {
    throw new ApiError(400, "Valid leavePolicyId is required");
  }

  const existingPolicy = await prisma.leavePolicy.findUnique({
    where: { id: Number(leavePolicyId) },
  });

  if (!existingPolicy || existingPolicy.companyId !== companyId) {
    throw new ApiError(404, "Leave policy not found or access denied");
  }

  await prisma.leavePolicy.delete({
    where: { id: Number(leavePolicyId) },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Leave policy deleted successfully"));
});

const updateLeavePolicy = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const { leavePolicyId } = req.params;
  const {
    leaveType,
    daysAllowed,
    carryForward,
    maxCarryForwardDays,
    isPaid,
    isActive,
  } = req.body;

  if (!leavePolicyId || isNaN(leavePolicyId)) {
    throw new ApiError(400, "Valid leavePolicyId is required");
  }

  const existingPolicy = await prisma.leavePolicy.findUnique({
    where: { id: Number(leavePolicyId) },
  });

  if (!existingPolicy || existingPolicy.companyId !== companyId) {
    throw new ApiError(404, "Leave policy not found or access denied");
  }

 
  if (
    carryForward === true &&
    (maxCarryForwardDays === undefined || maxCarryForwardDays === null)
  ) {
    throw new ApiError(
      400,
      "Max Carry Forward Days required if carry forward is allowed"
    );
  }

  const updatedPolicy = await prisma.leavePolicy.update({
    where: { id: Number(leavePolicyId) },
    data: {
      leaveType: leaveType ?? existingPolicy.leaveType,
      daysAllowed: daysAllowed ?? existingPolicy.daysAllowed,
      carryForward: carryForward ?? existingPolicy.carryForward,
      maxCarryForwardDays:
        maxCarryForwardDays ?? existingPolicy.maxCarryForwardDays,
      isPaid: isPaid ?? existingPolicy.isPaid,
      isActive: isActive ?? existingPolicy.isActive,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPolicy, "Leave policy updated successfully")
    );
});


export {createLeavePolicy,updateLeavePolicy,getAllLeavePolicy,deleteLeavePolicy}

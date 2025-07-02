import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import prisma from "../../config/prismaClient.js";
import dayjs from "dayjs";

const applyLeave = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.companyId;
  const userRole = req.user.role;

  if (["HR", "SR_MANAGER", "MANAGER", "ACCOUNTANT", "ADMIN"].includes(userRole)) {
    throw new ApiError(403, "Only employees can apply for leave");
  }

  const { leavePolicyId, fromDate, toDate, reason, isHalfDay, session } = req.body;

  if (!leavePolicyId || !fromDate || !toDate || !reason) {
    throw new ApiError(400, "All fields are required");
  }

  const leavePolicy = await prisma.leavePolicy.findFirst({
    where: { id: leavePolicyId, companyId }
  });

  if (!leavePolicy) {
    throw new ApiError(400, "Invalid Leave Policy");
  }

  const from = dayjs(fromDate).startOf("day");
  const to = dayjs(toDate).startOf("day");
  const today = dayjs().startOf("day");

  if (!from.isValid() || !to.isValid()) {
    throw new ApiError(400, "Invalid date format");
  }
  if (from.isBefore(today) || to.isBefore(today)) {
    throw new ApiError(400, "Leave dates should be in the future");
  }
  if (from.isAfter(to)) {
    throw new ApiError(400, "From Date cannot be after To Date");
  }

  const duplicate = await prisma.leaveApplication.findFirst({
    where: {
      employeeId: userId,
      fromDate: from.toDate(),
      toDate: to.toDate(),
      reason
    }
  });

  if (duplicate) {
    throw new ApiError(400, "Leave Application already exists for these dates");
  }

  const newLeave = await prisma.leaveApplication.create({
    data: {
      employeeId: userId,
      leavePolicyId,
      fromDate: from.toDate(),
      toDate: to.toDate(),
      reason,
      status: "PENDING",
      appliedAt: new Date(),
      isHalfDay: isHalfDay || false,
      session: isHalfDay ? session : null
    }
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newLeave, "Leave applied successfully"));
});

 const updateLeaveStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.companyId;
  const userRole = req.user.role;
  const userType = req.user.userType;

  if (userType === "employee" || !["HR", "SR_MANAGER"].includes(userRole)) {
    throw new ApiError(403, "You are not authorized to approve, reject, or cancel leave");
  }

  const { leaveId } = req.params;
  const { status, remarks } = req.body;

  if (!["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
    throw new ApiError(400, "Invalid status provided");
  }

  const leaveApplication = await prisma.leaveApplication.findFirst({
    where: {
      id: Number(leaveId),
      employee: {
        companyId: companyId
      }
    }
  });

  if (!leaveApplication) {
    throw new ApiError(404, "Leave application not found");
  }

  if (status === "CANCELLED") {
    await prisma.leaveApplication.delete({
      where: { id: leaveApplication.id }
    });
    return res.status(200).json(
      new ApiResponse(200, {}, "Leave application cancelled and removed")
    );
  }

  const updatedLeave = await prisma.leaveApplication.update({
    where: { id: leaveApplication.id },
    data: {
      status,
      approvedById: userId,
      remarks: remarks || null
    },
    include: {
      approvedBy: {
        select: { id: true, name: true }
      },
      employee: {
        select: { id: true, name: true }
      },
      leavePolicy: {
        select: { id: true, leaveType: true }
      }
    }
  });

  return res.status(200).json(
    new ApiResponse(200, updatedLeave, `Leave ${status.toLowerCase()} successfully`)
  );
});

const getAllLeaveApplications = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const userType = req.userType;
  const userRole = req.user.role;

  if (userType === 'employee' || !["ADMIN", "HR", "SR_MANAGER"].includes(userRole)) {
    throw new ApiError(403, "You are not authorized to view leave applications");
  }

  const { status, employeeCode, fromDate, toDate, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const whereClause = {
    employee: { companyId },
  };

  if (employeeCode) {
    whereClause.employee.employeeCode = employeeCode;
  }

  if (status) {
    whereClause.status = status;
  }

  if (fromDate && toDate) {
    whereClause.OR = [
      { fromDate: { gte: new Date(fromDate), lte: new Date(toDate) } },
      { toDate: { gte: new Date(fromDate), lte: new Date(toDate) } }
    ];
  }

  const [total, leaveApplications] = await Promise.all([
    prisma.leaveApplication.count({ where: whereClause }),
    prisma.leaveApplication.findMany({
      where: whereClause,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { appliedAt: "desc" },
      include: {
        employee: { select: { name: true, employeeCode: true } },
        leavePolicy: { select: { leaveType: true } },
        approvedBy: { select: { name: true, employeeCode: true } }
      }
    })
  ]);

  return res.status(200).json(
    new ApiResponse(200, { total, page: Number(page), limit: Number(limit), leaveApplications }, "Leave applications fetched")
  );
});

const getMyLeaveApplications = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const employeeCode = req.user.employeeCode;

  const { status, fromDate, toDate, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const whereClause = {
    employee: { employeeCode, companyId },
  };

  if (status) {
    whereClause.status = status;
  }

  if (fromDate && toDate) {
    whereClause.OR = [
      { fromDate: { gte: new Date(fromDate), lte: new Date(toDate) } },
      { toDate: { gte: new Date(fromDate), lte: new Date(toDate) } }
    ];
  }

  const [total, leaveApplications] = await Promise.all([
    prisma.leaveApplication.count({ where: whereClause }),
    prisma.leaveApplication.findMany({
      where: whereClause,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { appliedAt: "desc" },
      include: {
        leavePolicy: { select: { leaveType: true } },
        approvedBy: { select: { name: true, employeeCode: true } }
      }
    })
  ]);

  return res.status(200).json(
    new ApiResponse(200, { total, page: Number(page), limit: Number(limit), leaveApplications }, "Your leave applications fetched")
  );
});

export {applyLeave,updateLeaveStatus,getAllLeaveApplications,getMyLeaveApplications}
 



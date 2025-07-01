import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import prisma from "../../config/prismaClient.js";



const raiseComplaint = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (["HR", "MANAGER", "SR_MANAGER", "ACCOUNTANT"].includes(userRole)) {
    throw new ApiError(403, "Only employees can raise complaints");
  }

  const { subject, description } = req.body;

  if (!subject || !description) {
    throw new ApiError(400, "Subject and description are required");
  }

  const complaint = await prisma.complain.create({
    data: {
      employeeId: userId,
      companyId: req.user.companyId,
      subject,
      description,
      status: "PENDING",
      raisedAt: new Date(),
    },
  });

  return res.status(201).json(new ApiResponse(201, complaint, "Complaint raised successfully"));
});


const getAllComplaints = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userType = req.userType;

  if (userType !== "admin" && !["HR", "MANAGER", "SR_MANAGER"].includes(userRole)) {
    throw new ApiError(403, "Access denied");
  }

  const { employeeName, status, page = 1, limit = 10 } = req.query;

  const filters = { companyId: req.user.companyId };

  if (status) {
    filters.status = status;
  }

  const employeeFilters = { companyId: req.user.companyId };

  if (employeeName) {
    employeeFilters.name = { contains: employeeName, mode: "insensitive" };
  }

  const matchingEmployees = await prisma.employee.findMany({
    where: employeeFilters,
    select: { id: true },
  });

  const employeeIds = matchingEmployees.map(emp => emp.id);

  if (employeeIds.length > 0) {
    filters.employeeId = { in: employeeIds };
  } else if (employeeName) {
    return res.status(200).json(
      new ApiResponse(200, { totalRecords: 0, totalPages: 0, currentPage: Number(page), records: [] }, "Complaints fetched successfully")
    );
  }

  const skip = (Number(page) - 1) * Number(limit);

  const complaints = await prisma.complain.findMany({
    where: filters,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          department: { select: { name: true } },
        },
      },
    },
    skip,
    take: Number(limit),
    orderBy: { raisedAt: "desc" },
  });

  const totalRecords = await prisma.complain.count({ where: filters });

  return res.status(200).json(
    new ApiResponse(200, {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      records: complaints,
    }, "Complaints fetched successfully")
  );
});


const updateComplaint = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userType = req.userType;

  if (userType !== "admin" && !["HR", "MANAGER", "SR_MANAGER"].includes(userRole)) {
    throw new ApiError(403, "Access denied");
  }

  const { complaintId } = req.params;
  const { status, remarks } = req.body;

  if (!complaintId) {
    throw new ApiError(400, "Complaint ID is required");
  }

  if (!["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const existingComplaint = await prisma.complain.findUnique({
    where: { id: Number(complaintId) },
  });

  if (!existingComplaint) {
    throw new ApiError(404, "Complaint not found");
  }

  const updatedComplaint = await prisma.complain.update({
    where: { id: Number(complaintId) },
    data: {
      status,
      remarks,
      updatedAt: new Date(),
    },
  });

  return res.status(200).json(
    new ApiResponse(200, updatedComplaint, "Complaint updated successfully")
  );
});


const getOwnComplaints = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (["HR", "MANAGER", "SR_MANAGER", "ACCOUNTANT"].includes(userRole)) {
    throw new ApiError(403, "Only employees can view their complaints");
  }

  const complaints = await prisma.complain.findMany({
    where: { employeeId: userId },
    orderBy: { raisedAt: "desc" },
  });

  return res.status(200).json(
    new ApiResponse(200, complaints, "Complaints fetched successfully")
  );
});

export { raiseComplaint,getAllComplaints,updateComplaint,getOwnComplaints}

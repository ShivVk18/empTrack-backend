import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const addDesignation = asyncHandler(async (req, res) => {
  const { designationName, designationCode, description, level, departmentName } = req.body;
  const companyId = req.user?.companyId;

  if (!designationName || !designationCode || !departmentName) {
    throw new ApiError(400, "Designation name, code and department name are required");
  }

  const department = await prisma.department.findFirst({
    where: { name: departmentName, companyId },
  });

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  const existingDesignation = await prisma.designation.findFirst({
    where: {
      companyId,
      OR: [{ name: designationName }, { code: designationCode }],
    },
  });

  if (existingDesignation) {
    throw new ApiError(400, "Designation with this name or code already exists");
  }

  const designation = await prisma.designation.create({
    data: {
      name: designationName,
      code: designationCode,
      description: description || null,
      level: level || null,
      departmentId: department.id,
      companyId,
    },
  });

  return res.status(201).json(new ApiResponse(201, designation, "Designation added successfully"));
});

const getAllDesignationsByDepartment = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const departmentId = Number.parseInt(req.query?.departmentId);
  const page = Number.parseInt(req.query?.page) || 1;
  const limit = Number.parseInt(req.query?.limit) || 10;

  if (!departmentId) {
    throw new ApiError(400, "departmentId is required in query");
  }

  const skip = (page - 1) * limit;

  const [designations, totalCount] = await Promise.all([
    prisma.designation.findMany({
      where: { companyId, departmentId },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.designation.count({
      where: { companyId, departmentId },
    }),
  ]);

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
    hasNext: page * limit < totalCount,
    hasPrev: page > 1,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        designations,
        pagination,
      },
      "Designations fetched successfully"
    )
  );
});


const getDesignationById = asyncHandler(async (req, res) => {
  const designationId = Number.parseInt(req.params?.id);
  const companyId = req.user?.companyId;

  if (!designationId) {
    throw new ApiError(400, "Designation ID is required");
  }

  const designation = await prisma.designation.findFirst({
    where: { id: designationId, companyId },
    include: {
      employees: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeCode: true,
          role: true,
          isActive: true,
          department: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { employees: true, payParameters: true } },
    },
  });

  if (!designation) {
    throw new ApiError(404, "Designation not found");
  }

  return res.status(200).json(new ApiResponse(200, designation, "Designation details fetched successfully"));
});

const updateDesignation = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const designationId = Number.parseInt(req.params?.id);
  const { designationName, designationCode, description, level } = req.body;

  if (!designationId) {
    throw new ApiError(400, "Designation ID is required");
  }
  if (!designationName) {
    throw new ApiError(400, "Designation name is required");
  }

  const existingDesignation = await prisma.designation.findFirst({
    where: { id: designationId, companyId },
  });

  if (!existingDesignation) {
    throw new ApiError(404, "Designation not found");
  }

  const duplicateDesignation = await prisma.designation.findFirst({
    where: {
      companyId,
      id: { not: designationId },
      OR: [
        { name: designationName },
        ...(designationCode ? [{ code: designationCode }] : []),
      ],
    },
  });

  if (duplicateDesignation) {
    throw new ApiError(400, "Designation with this name or code already exists");
  }

  const updatedDesignation = await prisma.designation.update({
    where: { id: designationId },
    data: {
      name: designationName,
      code: designationCode || null,
      description: description || null,
      level: level || null,
    },
  });

  return res.status(200).json(new ApiResponse(200, updatedDesignation, "Designation updated successfully"));
});

const deleteDesignation = asyncHandler(async (req, res) => {
  const designationId = Number.parseInt(req.params?.id);
  const companyId = req.user?.companyId;
  
  if (!designationId) {
    throw new ApiError(400, "Designation ID is required");
  }

  const designation = await prisma.designation.findFirst({
    where: { id: designationId, companyId },
    include: { employees: true, payParameters: true },
  });

  if (!designation) {
    throw new ApiError(404, "Designation not found");
  }

  if (designation.employees.length > 0) {
    throw new ApiError(400, "Cannot delete designation with existing employees");
  }

  if (designation.payParameters.length > 0) {
    throw new ApiError(400, "Cannot delete designation with existing pay parameters");
  }

  await prisma.designation.delete({
    where: { id: designationId },
  });

  return res.status(200).json(new ApiResponse(200, {}, "Designation deleted successfully"));
});

export {
  addDesignation,
  getAllDesignationsByDepartment,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
};

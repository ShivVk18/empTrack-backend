import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { hasPermission } from "../../middlewares/auth.middleware.js";

const addDesignation = asyncHandler(async (req, res) => {
  const { designationName, designationCode, description, level } = req.body;
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!designationName || !designationCode) {
    throw new ApiError(400, "Designation name and code are required");
  }

  if (!hasPermission(currentUser.role, userType, "designation:manage")) {
    throw new ApiError(403, "Insufficient permissions to create designations");
  }

  const existingDesignation = await prisma.designation.findFirst({
    where: {
      companyId: companyId,
      OR: [{ name: designationName }, { code: designationCode }],
    },
  });

  if (existingDesignation) {
    throw new ApiError(
      400,
      "Designation with this name or code already exists"
    );
  }

  const designation = await prisma.designation.create({
    data: {
      name: designationName,
      code: designationCode,
      description: description,
      level: level || null,
      companyId: companyId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, designation, "Designation added successfully"));
});

const getAllDesignations = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const {
    includeStats = false,
    page,
    limit,
    sortBy = "name",
    sortOrder = "asc",
  } = req.query;
  const currentUser = req.user;
  const userType = req.userType;

  if (!hasPermission(currentUser.role, userType, "designation:read")) {
    throw new ApiError(403, "Insufficient permissions to view designations");
  }

  const queryOptions = {
    where: { companyId },
    orderBy: { [sortBy]: sortOrder },
  };

  if (page && limit) {
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);
    const take = Number.parseInt(limit);
    queryOptions.skip = skip;
    queryOptions.take = take;
  }

  if (includeStats === "true") {
    queryOptions.include = {
      _count: {
        select: {
          employees: true,
          payParameters: true,
        },
      },
    };
  }

  const [designations, totalCount] = await Promise.all([
    prisma.designation.findMany(queryOptions),
    page && limit ? prisma.designation.count({ where: { companyId } }) : null,
  ]);

  const response = { designations };

  if (page && limit) {
    response.pagination = {
      currentPage: Number.parseInt(page),
      totalPages: Math.ceil(totalCount / Number.parseInt(limit)),
      totalCount,
      hasNext: Number.parseInt(page) * Number.parseInt(limit) < totalCount,
      hasPrev: Number.parseInt(page) > 1,
    };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Designations fetched successfully"));
});

const getDesignationById = asyncHandler(async (req, res) => {
  const designationId = Number.parseInt(req.params?.id);
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!designationId) {
    throw new ApiError(400, "Designation ID is required");
  }

  if (!hasPermission(currentUser.role, userType, "designation:read")) {
    throw new ApiError(
      403,
      "Insufficient permissions to view designation details"
    );
  }

  const designation = await prisma.designation.findFirst({
    where: {
      id: designationId,
      companyId,
    },
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
      _count: {
        select: {
          employees: true,
          payParameters: true,
        },
      },
    },
  });

  if (!designation) {
    throw new ApiError(404, "Designation not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        designation,
        "Designation details fetched successfully"
      )
    );
});

const updateDesignation = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const designationId = Number.parseInt(req.params?.id);
  const { designationName, designationCode, description, level } = req.body;
  const currentUser = req.user;
  const userType = req.userType;

  if (!designationId) {
    throw new ApiError(400, "Designation ID is required");
  }

  if (!designationName) {
    throw new ApiError(400, "Designation name is required");
  }

  if (!hasPermission(currentUser.role, userType, "designation:manage")) {
    throw new ApiError(403, "Insufficient permissions to update designations");
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
    throw new ApiError(
      400,
      "Designation with this name or code already exists"
    );
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

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedDesignation,
        "Designation updated successfully"
      )
    );
});

const deleteDesignation = asyncHandler(async (req, res) => {
  const designationId = Number.parseInt(req.params?.id);
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!designationId) {
    throw new ApiError(400, "Designation ID is required");
  }

  if (!hasPermission(currentUser.role, userType, "designation:manage")) {
    throw new ApiError(403, "Insufficient permissions to delete designations");
  }

  const designation = await prisma.designation.findFirst({
    where: {
      id: designationId,
      companyId,
    },
    include: {
      employees: true,
      payParameters: true,
    },
  });

  if (!designation) {
    throw new ApiError(404, "Designation not found");
  }

  if (designation.employees.length > 0) {
    throw new ApiError(
      400,
      "Cannot delete designation with existing employees"
    );
  }

  if (designation.payParameters.length > 0) {
    throw new ApiError(
      400,
      "Cannot delete designation with existing pay parameters"
    );
  }

  await prisma.designation.delete({
    where: { id: designationId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Designation deleted successfully"));
});

export {
  addDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
};

import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { hasPermission } from "../../middlewares/auth.middleware.js";

const addDepartment = asyncHandler(async (req, res) => {
  const { departmentName, departmentCode, description } = req.body;
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!departmentName || !departmentCode || !description) {
    throw new ApiError(400, "All fields are required");
  }


  if (!hasPermission(currentUser.role, userType, "department:manage")) {
    throw new ApiError(403, "Insufficient permissions to create departments");
  }

  const existingDepartment = await prisma.department.findFirst({
    where: {
      companyId: companyId,
      OR: [{ name: departmentName }, { code: departmentCode }],
    },
  });

  if (existingDepartment) {
    throw new ApiError(400, "Department with this name or code already exists");
  }

  const department = await prisma.department.create({
    data: {
      name: departmentName,
      code: departmentCode || null,
      description: description || null,
      companyId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, department, "Department created successfully"));
});

const getAllDepartments = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const { includeStats = false, page, limit } = req.query;
  const currentUser = req.user;
  const userType = req.userType;

  
  if (!hasPermission(currentUser.role, userType, "department:read")) {
    throw new ApiError(403, "Insufficient permissions to view departments");
  }

  const queryOptions = {
    where: { companyId },
    orderBy: { name: "asc" },
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

  const [departments, totalCount] = await Promise.all([
    prisma.department.findMany(queryOptions),
    page && limit ? prisma.department.count({ where: { companyId } }) : null,
  ]);

  const response = { departments };

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
    .json(new ApiResponse(200, response, "Departments fetched successfully"));
});

const getDepartmentById = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const departmentId = Number.parseInt(req.params?.id);
  const currentUser = req.user;
  const userType = req.userType;

  if (!departmentId) {
    throw new ApiError(400, "Department ID is required");
  }

  if (!hasPermission(currentUser.role, userType, "department:read")) {
    throw new ApiError(
      403,
      "Insufficient permissions to view department details"
    );
  }

  const department = await prisma.department.findFirst({
    where: {
      id: departmentId,
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
          designation: { select: { name: true } },
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

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        department,
        "Department details fetched successfully"
      )
    );
});

const updateDepartment = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const departmentId = Number.parseInt(req.params?.id);
  const { departmentName, departmentCode, description } = req.body;
  const currentUser = req.user;
  const userType = req.userType;

  if (!departmentId) {
    throw new ApiError(400, "Department ID is required");
  }

  if (!departmentName) {
    throw new ApiError(400, "Department name is required");
  }

  
  if (!hasPermission(currentUser.role, userType, "department:manage")) {
    throw new ApiError(403, "Insufficient permissions to update departments");
  }

  const existingDepartment = await prisma.department.findFirst({
    where: { id: departmentId, companyId },
  });

  if (!existingDepartment) {
    throw new ApiError(404, "Department not found");
  }

  const duplicateDepartment = await prisma.department.findFirst({
    where: {
      companyId,
      id: { not: departmentId },
      OR: [
        { name: departmentName },
        ...(departmentCode ? [{ code: departmentCode }] : []),
      ],
    },
  });

  if (duplicateDepartment) {
    throw new ApiError(400, "Department with this name or code already exists");
  }

  const updatedDepartment = await prisma.department.update({
    where: { id: departmentId },
    data: {
      name: departmentName,
      code: departmentCode || null,
      description: description || null,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedDepartment, "Department updated successfully")
    );
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const departmentId = Number.parseInt(req.params?.id);
  const currentUser = req.user;
  const userType = req.userType;

  if (!departmentId) {
    throw new ApiError(400, "Department ID is required");
  }

  
  if (!hasPermission(currentUser.role, userType, "department:manage")) {
    throw new ApiError(403, "Insufficient permissions to delete departments");
  }

  const department = await prisma.department.findFirst({
    where: {
      id: departmentId,
      companyId,
    },
    include: {
      employees: true,
      payParameters: true,
    },
  });

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  if (department.employees.length > 0) {
    throw new ApiError(400, "Cannot delete department with existing employees");
  }

  if (department.payParameters.length > 0) {
    throw new ApiError(
      400,
      "Cannot delete department with existing pay parameters"
    );
  }

  await prisma.department.delete({
    where: { id: departmentId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Department deleted successfully"));
});

export {
  addDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};

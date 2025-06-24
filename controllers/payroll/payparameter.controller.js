import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const createPayParameter = asyncHandler(async (req, res) => {
  const {
    employeeType,
    departmentName,
    designationName,
    da,
    ta,
    hra,
    spall,
    medicalAllRate,
    medicalAllFixed,
    epfRate,
    esiRate,
    tdsRate,
    professionalTaxRate,
    esiSalaryLimit,
    epfSalaryLimit,
  } = req.body;

  const companyId = req.user?.companyId;
  if (!companyId) throw new ApiError(401, "Unauthorized access");

  if (!employeeType) {
    throw new ApiError(400, "Employee type is required");
  }

  const validEmployeeType = [
    "PERMANENT",
    "CONTRACT",
    "INTERN",
    "CONSULTANT",
    "PART_TIME",
  ];

  if (!validEmployeeType.includes(employeeType)) {
    throw new ApiError(400, "Invalid Employee Type");
  }

  const existingParam = await prisma.payParameter.findFirst({
    where: {
      companyId,
      employeeType: employeeType,
    },
  });

  if (existingParam) {
    throw new ApiError(
      400,
      `Pay parameter for employee type '${employeeType}' already exists`
    );
  }

  let departmentId = null;
  let designationId = null;

  if (departmentName) {
    const department = await prisma.department.findFirst({
      where: { name: departmentName, companyId },
    });
    if (!department) throw new ApiError(400, "Invalid department name");
    departmentId = department.id;
  }

  if (designationName) {
    const designation = await prisma.designation.findFirst({
      where: { name: designationName, companyId },
    });
    if (!designation) throw new ApiError(400, "Invalid designation name");
    designationId = designation.id;
  }

  //validate percentage values
  const percentageFields = {
    da,
    ta,
    hra,
    spall,
    medicalAllRate,
    epfRate,
    esiRate,
    tdsRate,
    professionalTaxRate,
  };

  for (let key in percentageFields) {
    const val = percentageFields[key];

    if (val !== undefined && (val < 0 || val > 100)) {
      throw new ApiError(400, `${key} must be between 0 and 100`);
    }
  }

  const payParameter = await prisma.payParameter.create({
    data: {
      companyId,
      employeeType,
      designationId: designationId,
      departmentId: departmentId,
      da: da || 0,
      ta: ta || 0,
      hra: hra || 0,
      spall: spall || 0,
      medicalAllRate: medicalAllRate || 0,
      medicalAllFixed: medicalAllFixed || 0,
      epfRate: epfRate || 12.0,
      esiRate: esiRate || 0.75,
      tdsRate: tdsRate || 0,
      professionalTaxRate: professionalTaxRate || 0,
      esiSalaryLimit: esiSalaryLimit || 25000,
      epfSalaryLimit: epfSalaryLimit || 15000,
    },
    include: {
      company: { select: { name: true } },
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, payParameter, "Pay parameter created successfully")
    );
});

const getPayParameters = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;

  const { page, limit, employeeType, departmentName, designationName } =
    req.query;

  if (!companyId) throw new ApiError(401, "Unauthorized access");

  const whereClause = { companyId };

  if (employeeType) {
    whereClause.employeeType = employeeType;
  }

  if (departmentName) {
    const department = await prisma.department.findFirst({
      where: { name: departmentName, companyId: companyId },
    });

    if (department) {
      whereClause.departmentId = department.id;
    }
  }

  if (designationName) {
    const designation = await prisma.designation.findFirst({
      where: { name: departmentName, companyId: companyId },
    });
    if (designation) {
      whereClause.designationId = designation.id;
    }
  }

  const queryOptions = {
    where: { whereClause },
    include: {
      designation: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: [{ employeeType: "asc" }, { department: { name: "asc" } }],
  };

  if (page && limit) {
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);
    const take = Number.parseInt(limit);
    queryOptions.skip = skip;
    queryOptions.take = take;
  }

  const [payParameters, totalCount] = await Promise.all([
    prisma.payParameter.findMany(queryOptions),
    page && limit ? prisma.payParameter.count({ where: whereClause }) : null,
  ]);

  if (payParameters.length === 0) {
    throw new ApiError(404, "No pay parameters found");
  }

  const response = { payParameters };

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
    .json(
      new ApiResponse(200, response, "Pay parameters fetched successfully")
    );
});

const getPayParametersByType = asyncHandler(async (req, res) => {
  const { employeeType } = req.params;
  const companyId = req.user?.companyId;

  if (!companyId) throw new ApiError(401, "Unauthorized access");
  if (!employeeType) throw new ApiError(400, "Employee type is required");

  const payParameter = await prisma.payParameter.findFirst({
    where: {
      employeeType: employeeType,
      companyId: companyId,
    },
    include: {
      designation: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (!payParameter) {
    throw new ApiError(404, `Pay parameter for ${employeeType} not found`);
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, payParameter, "Pay parameter fetched successfully")
    );
});

const updatePayParameter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  if (!companyId) throw new ApiError(401, "Unauthorized access");
  if (!id) throw new ApiError(400, "Pay parameter ID is required");

  const payParameter = await prisma.payParameter.findFirst({
    where: {
      id: Number.parseInt(id),
      companyId,
    },
  });

  if (!payParameter) {
    throw new ApiError(404, "Pay parameter not found");
  }

  const updateData = {};
  const allowedFields = [
    "da",
    "ta",
    "hra",
    "spall",
    "medicalAllRate",
    "medicalAllFixed",
    "epfRate",
    "esiRate",
    "tdsRate",
    "professionalTaxRate",
    "esiSalaryLimit",
    "epfSalaryLimit",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  // Validate percentage values
  const percentageFields = [
    "da",
    "ta",
    "hra",
    "spall",
    "medicalAllRate",
    "epfRate",
    "esiRate",
    "tdsRate",
    "professionalTaxRate",
  ];
  for (const field of percentageFields) {
    if (
      updateData[field] !== undefined &&
      (updateData[field] < 0 || updateData[field] > 100)
    ) {
      throw new ApiError(400, `${field} must be between 0 and 100`);
    }
  }

  const updatedPayParameter = await prisma.payParameter.update({
    where: { id: Number.parseInt(id) },
    data: updateData,
    include: {
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPayParameter,
        "Pay parameter updated successfully"
      )
    );
});

const deletePayparameter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  if (!companyId) throw new ApiError(401, "Unauthorized access");
  if (!id) throw new ApiError(400, "Pay parameter ID is required");

  const payParameter = await prisma.payParameter.findFirst({
    where: {
      id: Number.parseInt(id),
      companyId,
    },
  });

  if (!payParameter) {
    throw new ApiError(404, "Pay parameter not found");
  }

  const payrollCount = await prisma.payMaster.count({
    where: {
      companyId,
      employee: {
        type: payParameter.employeeType,
      },
    },
  });

  if (payrollCount > 0) {
    throw new ApiError(
      400,
      "Cannot delete pay parameter that has been used in payroll generation"
    );
  }

  await prisma.payParameter.delete({
    where: { id: Number.parseInt(id) },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Pay parameter deleted successfully"));
});

export {
  createPayParameter,
  getPayParameters,
  deletePayparameter,
  getPayParametersByType,
  updatePayParameter,
};

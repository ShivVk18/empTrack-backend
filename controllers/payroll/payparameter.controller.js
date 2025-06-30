import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const validEmployeeTypes = [
  "PERMANENT",
  "CONTRACT",
  "INTERN",
  "CONSULTANT",
  "PART_TIME",
];
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

const fetchDepartmentId = async (departmentName, companyId) => {
  if (!departmentName) return null;
  const department = await prisma.department.findFirst({
    where: { name: departmentName, companyId },
  });
  if (!department) throw new ApiError(400, "Invalid department name");
  return department.id;
};

const fetchDesignationId = async (designationName, companyId) => {
  if (!designationName) return null;
  const designation = await prisma.designation.findFirst({
    where: { name: designationName, companyId },
  });
  if (!designation) throw new ApiError(400, "Invalid designation name");
  return designation.id;
};

const validatePercentages = (fields) => {
  for (const key of percentageFields) {
    if (fields[key] !== undefined && (fields[key] < 0 || fields[key] > 100)) {
      throw new ApiError(400, `${key} must be between 0 and 100`);
    }
  }
};

const createPayParameter = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const {
    employeeType,
    departmentName,
    designationName,
    medicalAllFixed,
    esiSalaryLimit,
    epfSalaryLimit,
    paidLeavePerMonth,
    unpaidLeavePenaltyPerDay,
    ...percentages
  } = req.body;

  if (!companyId) throw new ApiError(401, "Unauthorized access");
  if (!employeeType || !validEmployeeTypes.includes(employeeType))
    throw new ApiError(400, "Invalid or missing Employee Type");

  const existingParam = await prisma.payParameter.findFirst({
    where: { companyId, employeeType },
  });
  if (existingParam)
    throw new ApiError(
      400,
      `Pay parameter for '${employeeType}' already exists`
    );

  const departmentId = await fetchDepartmentId(departmentName, companyId);
  const designationId = await fetchDesignationId(designationName, companyId);

  validatePercentages(percentages);

  const payParameter = await prisma.payParameter.create({
    data: {
      companyId,
      employeeType,
      departmentId,
      designationId,
      ...percentages,
      medicalAllFixed: medicalAllFixed || 0,
      esiSalaryLimit: esiSalaryLimit || 25000,
      epfSalaryLimit: epfSalaryLimit || 15000,
      paidLeavePerMonth: paidLeavePerMonth || 1.0,
      unpaidLeavePenaltyPerDay: unpaidLeavePenaltyPerDay || 0,
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
  if (!companyId) throw new ApiError(401, "Unauthorized access");

  const { page, limit, employeeType, departmentName, designationName } =
    req.query;
  const where = { companyId };

  if (employeeType) where.employeeType = employeeType;
  if (departmentName)
    where.departmentId = await fetchDepartmentId(departmentName, companyId);
  if (designationName)
    where.designationId = await fetchDesignationId(designationName, companyId);

  const queryOptions = {
    where,
    include: {
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
    orderBy: [{ employeeType: "asc" }, { department: { name: "asc" } }],
  };

  if (page && limit) {
    queryOptions.skip = (parseInt(page) - 1) * parseInt(limit);
    queryOptions.take = parseInt(limit);
  }

  const [payParameters, totalCount] = await Promise.all([
    prisma.payParameter.findMany(queryOptions),
    page && limit ? prisma.payParameter.count({ where }) : null,
  ]);

  if (payParameters.length === 0)
    throw new ApiError(404, "No pay parameters found");

  const response = { payParameters };

  if (page && limit) {
    response.pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      hasNext: parseInt(page) * parseInt(limit) < totalCount,
      hasPrev: parseInt(page) > 1,
    };
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Pay parameters fetched successfully")
    );
});

const getPayParametersByType = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const { employeeType } = req.params;
  if (!companyId) throw new ApiError(401, "Unauthorized access");
  if (!employeeType) throw new ApiError(400, "Employee type is required");

  const payParameter = await prisma.payParameter.findFirst({
    where: { employeeType, companyId },
    include: {
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  });

  if (!payParameter)
    throw new ApiError(404, `Pay parameter for ${employeeType} not found`);

  return res
    .status(200)
    .json(
      new ApiResponse(200, payParameter, "Pay parameter fetched successfully")
    );
});

const updatePayParameter = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) throw new ApiError(401, "Unauthorized access");
  if (!id) throw new ApiError(400, "Pay parameter ID is required");

  const existingParam = await prisma.payParameter.findFirst({
    where: { id: parseInt(id), companyId },
  });
  if (!existingParam) throw new ApiError(404, "Pay parameter not found");

  const updateData = {};

  [
    ...percentageFields,
    "medicalAllFixed",
    "esiSalaryLimit",
    "epfSalaryLimit",
    "paidLeavePerMonth",
    "unpaidLeavePenaltyPerDay",
  ].forEach((field) => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  if (Object.keys(updateData).length === 0)
    throw new ApiError(400, "No valid fields to update");

  validatePercentages(updateData);

  const updatedPayParameter = await prisma.payParameter.update({
    where: { id: parseInt(id) },
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
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) throw new ApiError(401, "Unauthorized access");
  if (!id) throw new ApiError(400, "Pay parameter ID is required");

  const payParameter = await prisma.payParameter.findFirst({
    where: { id: parseInt(id), companyId },
  });
  if (!payParameter) throw new ApiError(404, "Pay parameter not found");

  const payrollCount = await prisma.payMaster.count({
    where: { companyId, employee: { type: payParameter.employeeType } },
  });

  if (payrollCount > 0)
    throw new ApiError(
      400,
      "Cannot delete pay parameter that has been used in payroll generation"
    );

  await prisma.payParameter.delete({ where: { id: parseInt(id) } });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Pay parameter deleted successfully"));
});

export {
  createPayParameter,
  getPayParameters,
  getPayParametersByType,
  updatePayParameter,
  deletePayparameter,
};

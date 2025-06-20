import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const createPayParameter = asyncHandler(async (req, res) => {
  const {
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

  const [department, designation] = await Promise.all([
    prisma.department.findFirst({
      where: { name: departmentName, companyId },
    }),
    prisma.designation.findFirst({
      where: { name: designationName, companyId },
    }),
  ]);

  if (!department) throw new ApiError(400, "Invalid department name");
  if (!designation) throw new ApiError(400, "Invalid designation name");

  const existingParam = await prisma.payParameter.findFirst({
    where: {
      companyId,
      departmentId: department.id,
      designationId: designation.id,
    },
  });

  if (existingParam) {
    throw new ApiError(
      400,
      "Pay parameter for this department and designation already exists"
    );
  }

  const payParameter = await prisma.payParameter.create({
    data: {
      companyId,
      designationId: designation.id,
      departmentId: department.id,
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
      company: true,
      department: true,
      designation: true,
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

  const payParameters = await prisma.payParameter.findMany({
    where: { companyId },
    include: {
      designation: true,
      department: true,
    },
    orderBy: [
      { department: { name: "asc" } },
      { designation: { name: "asc" } },
    ],
  });

  if (payParameters.length === 0) {
    throw new ApiError(404, "No pay parameters found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, payParameters, "Pay parameters fetched successfully")
    );
});

const deletePayparameter = asyncHandler(async (req, res) => {
  const { departmentId, designationId } = req.params;
  const companyId = req.user?.companyId;

  if (!companyId) throw new ApiError(401, "Unauthorized access");
  if (!departmentId || !designationId) {
    throw new ApiError(400, "Department ID and Designation ID are required");
  }

  const payParameter = await prisma.payParameter.findFirst({
    where: {
      companyId,
      departmentId: Number(departmentId),
      designationId: Number(designationId),
    },
    include: {
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  });

  if (!payParameter) {
    throw new ApiError(404, "Pay parameter not found");
  }

  await prisma.payParameter.delete({
    where: { id: payParameter.id },
  });

  console.log(
    `Deleted pay parameter for ${payParameter.department.name} - ${payParameter.designation.name}`
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Pay parameter deleted successfully"));
});


export { createPayParameter, getPayParameters, deletePayparameter };

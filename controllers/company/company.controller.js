import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const getCompanyDetails = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      state: { select: { stateName: true } },
      city: { select: { cityName: true } },
      _count: {
        select: {
          employees: true,
          departments: true,
          designations: true,
          payMasters: true,
        },
      },
    },
  });

  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, company, "Company details fetched successfully")
    );
});

const updateCompanyDetails = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const { companyName, industry, address, countryName ,stateName, cityName } = req.body;

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  if (!companyName || !industry || !address || !countryName || !stateName || !cityName) {
    throw new ApiError(400, "All fields are required");
  }

  const existingCompany = await prisma.company.findFirst({
    where: {
      name: companyName,
      id: { not: companyId },
    },
  });

  if (existingCompany) {
    throw new ApiError(400, "Company name is already taken");
  }

  


  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: companyName,
      industry: industry,
      address: address,
      countryName:countryName,
      stateName:stateName,
      cityName:cityName
    },
    
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedCompany,
        "Company details updated successfully"
      )
    );
});

const deleteCompany = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  
  const userType = req.userType;

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  // Only company admin can delete the company
  if (userType !== "admin") {
    throw new ApiError(403, "Only company admin can delete the company");
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      employees: { select: { id: true } },
      departments: { select: { id: true } },
      designations: { select: { id: true } },
      payMasters: { select: { id: true } },
      payParameters: { select: { id: true } },
      admins: { select: { id: true } },
    },
  });

  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  // Check for existing dependencies
  const dependencies = [];

  if (company.employees.length > 0) {
    dependencies.push(`${company.employees.length} employees`);
  }

  if (company.departments.length > 0) {
    dependencies.push(`${company.departments.length} departments`);
  }

  if (company.designations.length > 0) {
    dependencies.push(`${company.designations.length} designations`);
  }

  if (company.payMasters.length > 0) {
    dependencies.push(`${company.payMasters.length} payroll records`);
  }

  if (company.payParameters.length > 0) {
    dependencies.push(`${company.payParameters.length} pay parameters`);
  }

  if (dependencies.length > 0) {
    throw new ApiError(
      400,
      `Cannot delete company with existing data: ${dependencies.join(", ")}. Please remove all associated data first.`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.admin.deleteMany({
      where: { companyId },
    });

    await tx.company.delete({
      where: { id: companyId },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Company deleted successfully"));
});

export { getCompanyDetails, updateCompanyDetails, deleteCompany };

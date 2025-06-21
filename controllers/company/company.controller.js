import prisma from "../../config/prismaClient";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";

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
  const companyId = req.user?.id;

  const { companyName, industry, address, stateName, cityName } = req.body;

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  if (!name || !industry || !address || !stateName || !cityName) {
    throw new ApiError(400, "All fields are required");
  }

  const existingCompany = await prisma.company.findFirst({
    where: {
      name: companyId,
      id: { not: companyId },
    },
  });

  if (existingCompany) {
    throw new ApiError(400, "Company name is already taken");
  }

  const validLocation = await prisma.state.findFirst({
    where: { stateName: stateName },
    include: {
      cities: {
        where: {
          cityName: cityName,
        },
        take: 1,
      },
    },
  });

  if (!locationData || !locationData.cities[0]) {
    throw new ApiError(400, "Invalid state or city");
  }

  const updateCompany = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: companyName,
      industry: industry,
      address: address,
      stateId: locationData.id,
      cityId: locationData.cities[0].id,
    },
    include: {
      state: { select: { stateName: true } },
      city: { select: { cityName: true } },
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
  const { confirmDelete } = req.body;

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  // Check if company exists and get counts for confirmation
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      _count: {
        select: {
          employees: true,
          payMasters: true,
          departments: true,
          designations: true,
        },
      },
    },
  });

  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  const totalRecords =
    company._count.employees +
    company._count.payMasters +
    company._count.departments +
    company._count.designations;

  // Show warning if there are related records and no confirmation
  if (totalRecords > 0 && !confirmDelete) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          warning: true,
          message: `This will permanently delete all company data including:`,
          dataToDelete: {
            employees: company._count.employees,
            payrollRecords: company._count.payMasters,
            departments: company._count.departments,
            designations: company._count.designations,
          },
          totalRecords,
          confirmationRequired: true,
        },
        "Confirmation required for company deletion"
      )
    );
  }

  await prisma.company.delete({
    where: { id: companyId },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedCompanyId: companyId },
        "Company and all related data deleted successfully"
      )
    );
});

const getCompanyStats = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  const [
    totalEmployees,
    activeEmployees,
    totalDepartments,
    totalDesignations,
    currentMonthPayroll,
    totalPayrollRecords,
    recentPayroll,
  ] = await Promise.all([
    prisma.employee.count({ where: { companyId: companyId } }),
    prisma.employee.count({
      where: {
        companyId: companyId,
        isActive: true,
      },
    }),
    prisma.department.count({ where: { companyId: companyId } }),
    prisma.designation.count({ where: { companyId: companyId } }),
    prisma.payMaster.count({
      where: {
        companyId: companyId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    }),
    prisma.payMaster.count({ where: { companyId: companyId } }),
    prisma.payMaster.aggregate({
      where: {
        companyId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
      _sum: {
        grossSalary: true,
        netSalary: true,
        totalDeductions: true,
      },
    }),
  ]);

  const departmentStats = await prisma.department.findMany({
    where: { companyId: companyId },
    select: {
      name: true,
      _count: {
        select: { employees: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const roleStats = await prisma.employee.groupBy({
    by: ["role"],
    where: { companyId, isActive: true },
    _count: { role: true },
  });

  const typeStats = await prisma.employee.groupBy({
    by: ["type"],
    where: { companyId, isActive: true },
    _count: { type: true },
  });

  const stats = {
    overview: {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
      },
      departments: totalDepartments,
      designations: totalDesignations,
      payroll: {
        currentMonth: currentMonthPayroll,
        total: totalPayrollRecords,
        currentMonthAmount: recentPayroll._sum.netSalary || 0,
      },
    },
    breakdowns: {
      departments: departmentStats.map((dept) => ({
        department: dept.name,
        employeeCount: dept._count.employees,
      })),
      roles: roleStats.map((role) => ({
        role: role.role,
        count: role._count.role,
      })),
      employeeTypes: typeStats.map((type) => ({
        type: type.type,
        count: type._count.type,
      })),
    },
    currentMonth: {
      period: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      employeesProcessed: currentMonthPayroll,
      totalGross: recentPayroll._sum.grossSalary || 0,
      totalNet: recentPayroll._sum.netSalary || 0,
      totalDeductions: recentPayroll._sum.totalDeductions || 0,
    },
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, stats, "Company statistics fetched successfully")
    );
});

export {
  getCompanyDetails,
  updateCompanyDetails,
  deleteCompany,
  getCompanyStats,
};

import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { hasPermission } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendBulkEmail } from "../../utils/email.js";

const calculateSalaryComponents = (basicSalary, payParam, employeeType) => {
  const basic = Number.parseFloat(basicSalary);

  const typeMultipliers = {
    PERMANENT: 1.0,
    CONTRACT: 0.8,
    INTERN: 0.5,
    CONSULTANT: 0.9,
    PART_TIME: 0.6,
    TEMPORARY: 0.7,
  };

  const multiplier = typeMultipliers[employeeType] || 1.0;

  const da = basic * (Number.parseFloat(payParam.da) / 100) * multiplier;
  const ta = basic * (Number.parseFloat(payParam.ta) / 100) * multiplier;
  const hra = basic * (Number.parseFloat(payParam.hra) / 100) * multiplier;
  const spall = basic * (Number.parseFloat(payParam.spall) / 100) * multiplier;

  const medicalAll =
    Number.parseFloat(payParam.medicalAllFixed) > 0
      ? Number.parseFloat(payParam.medicalAllFixed) * multiplier
      : basic * (Number.parseFloat(payParam.medicalAllRate) / 100) * multiplier;

  const grossSalary = basic + da + ta + hra + spall + medicalAll;

  let epf = 0;
  let esi = 0;

  if (employeeType === "PERMANENT" || employeeType === "CONTRACT") {
    epf =
      basic <= Number.parseFloat(payParam.epfSalaryLimit)
        ? basic * (Number.parseFloat(payParam.epfRate) / 100)
        : 0;

    esi =
      grossSalary <= Number.parseFloat(payParam.esiSalaryLimit)
        ? grossSalary * (Number.parseFloat(payParam.esiRate) / 100)
        : 0;
  }

  const tds = grossSalary * (Number.parseFloat(payParam.tdsRate) / 100);
  const professionalTax =
    grossSalary * (Number.parseFloat(payParam.professionalTaxRate) / 100);

  const totalDeductions = epf + esi + tds + professionalTax;
  const netSalary = grossSalary - totalDeductions;

  return {
    basicSalary: basic,
    da,
    ta,
    hra,
    spall,
    medicalAll,
    grossSalary,
    epf,
    esi,
    tds,
    professionalTax,
    totalDeductions,
    netSalary,
    employeeType,
    typeMultiplier: multiplier,
  };
};

const generateSalary = asyncHandler(async (req, res) => {
  const { month, year, employeeType, departmentIds, employeeIds } = req.body;
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!hasPermission(currentUser.role, userType, "payroll:generate")) {
    throw new ApiError(403, "Insufficient permissions to generate payroll");
  }

  const targetDate = new Date();
  const targetMonth = month || targetDate.getMonth() + 1;
  const targetYear = year || targetDate.getFullYear();

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  if (targetMonth < 1 || targetMonth > 12) {
    throw new ApiError(400, "Invalid month. Must be between 1 and 12");
  }

  if (targetYear < 2023 || targetYear > new Date().getFullYear() + 1) {
    throw new ApiError(400, "Invalid year");
  }

  const employeeFilter = {
    companyId,
    isActive: true,
  };

  if (employeeType) {
    employeeFilter.type = employeeType;
  }

  if (departmentIds && departmentIds.length > 0) {
    employeeFilter.departmentId = {
      in: departmentIds.map((id) => Number.parseInt(id)),
    };
  }

  if (employeeIds && employeeIds.length > 0) {
    employeeFilter.id = { in: employeeIds.map((id) => Number.parseInt(id)) };
  }

  if (currentUser.role === "MANAGER" && userType === "employee") {
    employeeFilter.departmentId = currentUser.departmentId;
  }

  const existingSalaries = await prisma.payMaster.count({
    where: {
      companyId,
      month: targetMonth,
      year: targetYear,
      ...(employeeType && {
        employee: { type: employeeType },
      }),
      ...(departmentIds &&
        departmentIds.length > 0 && {
          employee: {
            departmentId: {
              in: departmentIds.map((id) => Number.parseInt(id)),
            },
          },
        }),
      ...(employeeIds &&
        employeeIds.length > 0 && {
          employeeId: { in: employeeIds.map((id) => Number.parseInt(id)) },
        }),
    },
  });

  if (existingSalaries > 0) {
    const typeMsg = employeeType ? ` for ${employeeType} employees` : "";
    throw new ApiError(
      400,
      `Salaries for ${targetMonth}/${targetYear}${typeMsg} already generated. Use update function instead.`
    );
  }

  const employees = await prisma.employee.findMany({
    where: employeeFilter,
    include: {
      department: true,
      designation: true,
    },
  });

  if (employees.length === 0) {
    const typeMsg = employeeType ? ` of type ${employeeType}` : "";
    throw new ApiError(404, `No active employees${typeMsg} found`);
  }

  const generatedSalaries = await prisma.$transaction(async (tx) => {
    const salaryRecords = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Skip if no basic salary
        if (!employee.salary || employee.salary <= 0) {
          errors.push(
            `Employee ${employee.employeeCode}: No valid salary found`
          );
          continue;
        }

        // Find pay parameters for this employee type
        const payParam = await tx.payParameter.findFirst({
          where: {
            companyId,
            employeeType: employee.type,
          },
        });

        if (!payParam) {
          errors.push(
            `Employee ${employee.employeeCode}: No pay parameters found for type ${employee.type}`
          );
          continue;
        }

        // Calculate salary components based on employee type
        const salaryComponents = calculateSalaryComponents(
          employee.salary,
          payParam,
          employee.type
        );

        // Create salary record
        const salaryRecord = await tx.payMaster.create({
          data: {
            employeeId: employee.id,
            companyId,
            month: targetMonth,
            year: targetYear,
            ...salaryComponents,
            otherAll: 0,
            otherDeductions: 0,
            remarks: `Generated by ${currentUser.name} on ${new Date().toISOString()}`,
          },
          include: {
            employee: {
              select: {
                employeeCode: true,
                name: true,
                type: true,
                department: { select: { name: true } },
                designation: { select: { name: true } },
              },
            },
          },
        });

        salaryRecords.push(salaryRecord);
      } catch (error) {
        errors.push(`Employee ${employee.employeeCode}: ${error.message}`);
      }
    }

    return { salaryRecords, errors };
  });

  try {
    for (const record of generatedSalaries.salaryRecords) {
      if (!record.employee.email) {
        console.warn(
          `Skipping email for ${record.employee.name} - no email provided`
        );
        continue;
      }

      const recipient = {
        email: record.employee.email,
        name: record.employee.name,
      };

      const salaryDetails = {
        month: targetMonth,
        year: targetYear,
        basicSalary: record.basicSalary,
        da: record.da,
        ta: record.ta,
        hra: record.hra,
        spall: record.spall,
        medicalAll: record.medicalAll,
        grossSalary: record.grossSalary,
        epf: record.epf,
        esi: record.esi,
        tds: record.tds,
        professionalTax: record.professionalTax,
        totalDeductions: record.totalDeductions,
        netSalary: record.netSalary,
      };

      await sendBulkEmail([recipient], "payslip", salaryDetails);
    }
  } catch (error) {
    console.error("Error sending payslip emails:", error);
  }

  if (generatedSalaries.salaryRecords.length === 0) {
    throw new ApiError(
      400,
      "No salaries were generated. Check pay parameters configuration."
    );
  }

  // Group results by employee type for summary
  const summary = generatedSalaries.salaryRecords.reduce((acc, salary) => {
    const type = salary.employee.type;
    if (!acc[type]) {
      acc[type] = { count: 0, totalAmount: 0 };
    }
    acc[type].count++;
    acc[type].totalAmount += Number.parseFloat(salary.netSalary);
    return acc;
  }, {});

  const response = {
    count: generatedSalaries.salaryRecords.length,
    summary,
    salaries: generatedSalaries.salaryRecords,
    ...(generatedSalaries.errors.length > 0 && {
      errors: generatedSalaries.errors,
    }),
  };

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        response,
        `Generated ${generatedSalaries.salaryRecords.length} salary records for ${targetMonth}/${targetYear}`
      )
    );
});

const getEmployeeSalaries = asyncHandler(async (req, res) => {
  const {
    month,
    year,
    employeeId,
    employeeType,
    departmentId,
    designationId,
    page = 1,
    limit = 10,
    sortBy = "employee.name",
    sortOrder = "asc",
  } = req.query;

  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  // Build where clause
  const whereClause = { companyId };

  if (month && year) {
    whereClause.month = Number.parseInt(month);
    whereClause.year = Number.parseInt(year);
  }

  // RBAC: Permission-based filtering
  if (userType === "employee" && currentUser.role === "EMPLOYEE") {
    // Regular employees can only see their own salary
    whereClause.employeeId = currentUser.id;
  } else if (currentUser.role === "MANAGER" && userType === "employee") {
    // Managers can only see their department's salaries
    const departmentEmployees = await prisma.employee.findMany({
      where: { departmentId: currentUser.departmentId, companyId },
      select: { id: true },
    });
    whereClause.employeeId = { in: departmentEmployees.map((emp) => emp.id) };
  } else if (employeeId) {
    whereClause.employeeId = Number.parseInt(employeeId);
  }

  // Pagination
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);
  const take = Number.parseInt(limit);

  const [salaries, totalCount] = await Promise.all([
    prisma.payMaster.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { employee: { name: sortOrder } },
      ],
      include: {
        employee: {
          select: {
            employeeCode: true,
            name: true,
            email: true,
            role: true,
            type: true,
            departmentId: true,
            designationId: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    }),
    prisma.payMaster.count({ where: whereClause }),
  ]);

  // Additional filtering by employee type, department or designation
  let filteredSalaries = salaries;

  if (employeeType) {
    filteredSalaries = filteredSalaries.filter(
      (salary) => salary.employee.type === employeeType
    );
  }

  if (departmentId) {
    filteredSalaries = filteredSalaries.filter(
      (salary) => salary.employee.departmentId === Number.parseInt(departmentId)
    );
  }

  if (designationId) {
    filteredSalaries = filteredSalaries.filter(
      (salary) =>
        salary.employee.designationId === Number.parseInt(designationId)
    );
  }

  const pagination = {
    currentPage: Number.parseInt(page),
    totalPages: Math.ceil(totalCount / take),
    totalCount,
    hasNext: skip + take < totalCount,
    hasPrev: Number.parseInt(page) > 1,
  };

  // Calculate summary by employee type
  const typeSummary = filteredSalaries.reduce((acc, salary) => {
    const type = salary.employee.type;
    if (!acc[type]) {
      acc[type] = { count: 0, totalGross: 0, totalNet: 0 };
    }
    acc[type].count++;
    acc[type].totalGross += Number.parseFloat(salary.grossSalary);
    acc[type].totalNet += Number.parseFloat(salary.netSalary);
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        salaries: filteredSalaries,
        pagination,
        summary: typeSummary,
      },
      "Employee salaries fetched successfully"
    )
  );
});

const updateSalary = asyncHandler(async (req, res) => {
  const { payMasterId } = req.params;
  const { otherAll, otherDeductions, remarks, basicSalary } = req.body;
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!hasPermission(currentUser.role, userType, "payroll:update")) {
    throw new ApiError(403, "Insufficient permissions to update payroll");
  }

  const existingPayMaster = await prisma.payMaster.findFirst({
    where: {
      id: Number.parseInt(payMasterId),
      companyId,
    },
    include: {
      employee: {
        select: {
          departmentId: true,
          type: true,
        },
      },
    },
  });

  if (!existingPayMaster) {
    throw new ApiError(404, "Salary record not found");
  }

  if (currentUser.role === "MANAGER" && userType === "employee") {
    if (existingPayMaster.employee.departmentId !== currentUser.departmentId) {
      throw new ApiError(403, "Can only update payroll for your department");
    }
  }

  const newOtherAll =
    otherAll !== undefined
      ? Number.parseFloat(otherAll)
      : Number.parseFloat(existingPayMaster.otherAll);
  const newOtherDeductions =
    otherDeductions !== undefined
      ? Number.parseFloat(otherDeductions)
      : Number.parseFloat(existingPayMaster.otherDeductions);
  const newBasicSalary =
    basicSalary !== undefined
      ? Number.parseFloat(basicSalary)
      : Number.parseFloat(existingPayMaster.basicSalary);

  if (newOtherAll < 0 || newOtherDeductions < 0) {
    throw new ApiError(
      400,
      "Other allowances and deductions cannot be negative"
    );
  }

  if (newBasicSalary <= 0) {
    throw new ApiError(400, "Basic salary must be greater than 0");
  }

  let updatedComponents = {};

  if (basicSalary !== undefined) {
    // Get pay parameters and recalculate
    const payParam = await prisma.payParameter.findFirst({
      where: {
        companyId,
        employeeType: existingPayMaster.employee.type,
      },
    });

    if (payParam) {
      const recalculated = calculateSalaryComponents(
        newBasicSalary,
        payParam,
        existingPayMaster.employee.type
      );
      updatedComponents = {
        basicSalary: recalculated.basicSalary,
        da: recalculated.da,
        ta: recalculated.ta,
        hra: recalculated.hra,
        spall: recalculated.spall,
        medicalAll: recalculated.medicalAll,
        epf: recalculated.epf,
        esi: recalculated.esi,
        tds: recalculated.tds,
        professionalTax: recalculated.professionalTax,
      };
    }
  }

  // Calculate new totals
  const baseGross =
    Object.keys(updatedComponents).length > 0
      ? updatedComponents.basicSalary +
        updatedComponents.da +
        updatedComponents.ta +
        updatedComponents.hra +
        updatedComponents.spall +
        updatedComponents.medicalAll
      : Number.parseFloat(existingPayMaster.basicSalary) +
        Number.parseFloat(existingPayMaster.da) +
        Number.parseFloat(existingPayMaster.ta) +
        Number.parseFloat(existingPayMaster.hra) +
        Number.parseFloat(existingPayMaster.spall) +
        Number.parseFloat(existingPayMaster.medicalAll);

  const newGrossSalary = baseGross + newOtherAll;

  const baseDeductions =
    Object.keys(updatedComponents).length > 0
      ? updatedComponents.epf +
        updatedComponents.esi +
        updatedComponents.tds +
        updatedComponents.professionalTax
      : Number.parseFloat(existingPayMaster.epf) +
        Number.parseFloat(existingPayMaster.esi) +
        Number.parseFloat(existingPayMaster.tds) +
        Number.parseFloat(existingPayMaster.professionalTax);

  const newTotalDeductions = baseDeductions + newOtherDeductions;
  const newNetSalary = newGrossSalary - newTotalDeductions;

  const updateData = {
    ...updatedComponents,
    otherAll: newOtherAll,
    otherDeductions: newOtherDeductions,
    grossSalary: newGrossSalary,
    totalDeductions: newTotalDeductions,
    netSalary: newNetSalary,
    remarks: remarks || existingPayMaster.remarks,
    updatedAt: new Date(),
  };

  const updatedPayMaster = await prisma.payMaster.update({
    where: { id: Number.parseInt(payMasterId) },
    data: updateData,
    include: {
      employee: {
        select: {
          employeeCode: true,
          name: true,
          type: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPayMaster, "Salary updated successfully")
    );
});

export { generateSalary, getEmployeeSalaries, updateSalary };

import prisma from "../../config/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { hasPermission } from "../../middlewares/auth.middleware.js";

const getSalarySummary = asyncHandler(async (req, res) => {
  const { month, year, compareWithPrevious = false } = req.query;
  const { companyId, role, departmentId, userType } = req.user;

  if (!hasPermission(role, userType, "payroll:read")) {
    throw new ApiError(
      403,
      "Insufficient permissions to view payroll analytics"
    );
  }

  const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const whereClause = { companyId, month: targetMonth, year: targetYear };

  if (role === "MANAGER" && userType === "employee") {
    const deptEmployees = await prisma.employee.findMany({
      where: { departmentId, companyId },
      select: { id: true },
    });
    whereClause.employeeId = { in: deptEmployees.map((e) => e.id) };
  }

  const currentSummary = await prisma.payMaster.aggregate({
    where: whereClause,
    _sum: {
      basicSalary: true,
      da: true,
      ta: true,
      hra: true,
      spall: true,
      medicalAll: true,
      otherAll: true,
      grossSalary: true,
      totalPaidLeaves: true,
      totalUnpaidLeaves: true,
      unpaidLeaveDeduction: true,
      epf: true,
      esi: true,
      tds: true,
      professionalTax: true,
      otherDeductions: true,
      totalDeductions: true,
      netSalary: true,
    },
    _count: { id: true },
    _avg: { grossSalary: true, netSalary: true },
    _max: { netSalary: true },
    _min: { netSalary: true },
  });

  let previousSummary = null;
  let trends = null;

  if (compareWithPrevious === "true") {
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;

    const prevWhere = { ...whereClause, month: prevMonth, year: prevYear };

    previousSummary = await prisma.payMaster.aggregate({
      where: prevWhere,
      _sum: {
        grossSalary: true,
        netSalary: true,
        totalDeductions: true,
      },
      _count: { id: true },
    });

    if (previousSummary._sum?.grossSalary && currentSummary._sum?.grossSalary) {
      trends = {
        grossSalaryChange: (
          ((currentSummary._sum.grossSalary -
            previousSummary._sum.grossSalary) /
            previousSummary._sum.grossSalary) *
          100
        ).toFixed(2),
        netSalaryChange: (
          ((currentSummary._sum.netSalary - previousSummary._sum.netSalary) /
            previousSummary._sum.netSalary) *
          100
        ).toFixed(2),
        employeeCountChange:
          currentSummary._count.id - previousSummary._count.id,
      };
    }
  }

  const salaries = await prisma.payMaster.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          department: { select: { name: true } },
          designation: { select: { name: true } },
          type: true,
          role: true,
        },
      },
    },
  });

  const deptSummary = {};
  const typeSummary = {};
  const roleSummary = {};

  for (const record of salaries) {
    const dept = record.employee.department?.name || "Unassigned";
    const type = record.employee.type;
    const empRole = record.employee.role;

    if (!deptSummary[dept])
      deptSummary[dept] = {
        count: 0,
        totalGross: 0,
        totalNet: 0,
        totalDeductions: 0,
        avgNetSalary: 0,
      };
    if (!typeSummary[type])
      typeSummary[type] = { count: 0, totalGross: 0, totalNet: 0 };
    if (!roleSummary[empRole])
      roleSummary[empRole] = { count: 0, totalGross: 0, totalNet: 0 };

    deptSummary[dept].count++;
    deptSummary[dept].totalGross += Number(record.grossSalary);
    deptSummary[dept].totalNet += Number(record.netSalary);
    deptSummary[dept].totalDeductions += Number(record.totalDeductions);

    typeSummary[type].count++;
    typeSummary[type].totalGross += Number(record.grossSalary);
    typeSummary[type].totalNet += Number(record.netSalary);

    roleSummary[empRole].count++;
    roleSummary[empRole].totalGross += Number(record.grossSalary);
    roleSummary[empRole].totalNet += Number(record.netSalary);
  }

  for (const dept in deptSummary) {
    deptSummary[dept].avgNetSalary =
      deptSummary[dept].totalNet / deptSummary[dept].count;
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        period: `${targetMonth}/${targetYear}`,
        summary: currentSummary,
        previousPeriod: previousSummary,
        trends,
        breakdowns: {
          departments: deptSummary,
          employeeTypes: typeSummary,
          roles: roleSummary,
        },
      },
      "Salary summary with analytics fetched successfully"
    )
  );
});

export { getSalarySummary };

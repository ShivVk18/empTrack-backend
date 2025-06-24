import prisma from "../../config/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { hasPermission } from "../../middlewares/auth.middleware.js";

const getSalarySummary = asyncHandler(async (req, res) => {
  const { month, year, compareWithPrevious = false } = req.query;

  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!hasPermission(currentUser.role, userType, "payroll:read")) {
    throw new ApiError(403, "Not have permission to view payroll analytics");
  }

  const targetMonth = month
    ? Number.parseInt(month)
    : new Date().getMonth() + 1;
  const targetYear = year ? Number.parseInt(year) : new Date().getFullYear();

  const whereClause = {
    companyId,
    month: targetMonth,
    year: targetYear,
  };

  if (currentUser.role === "MANAGER" && userType === "employee") {
    const departmentEmployees = await prisma.employee.findMany({
      where: { departmentId: currentUser.departmentId, companyId: companyId },
      select: { id: true },
    });

    whereClause.employeeId = { in: departmentEmployees.map((emp) => emp.id) };
  }

  const currentSummary = await prisma.payMaster.aggregate({
    where: whereClause,
    _sum: {
      basicSalary: true,
      grossSalary: true,
      totalDeductions: true,
      netSalary: true,
      epf: true,
      esi: true,
      tds: true,
      professionalTax: true,
      otherAll: true,
      otherDeductions: true,
    },
    _count: {
      id: true,
    },
    _avg: {
      grossSalary: true,
      netSalary: true,
    },
    _max: {
      netSalary: true,
    },
    _min: {
      netSalary: true,
    },
  });

  let previousSummary = null;
  let trends = null;

  if (compareWithPrevious === "true") {
    const previousMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const previousYear = targetMonth === 1 ? targetYear - 1 : targetYear;

    const prevWhereClause = {
      ...whereClause,
      month: previousMonth,
      year: previousYear,
    };

    previousSummary = await prisma.payMaster.aggregate({
      where: prevWhereClause,
      _sum: {
        grossSalary: true,
        netSalary: true,
        totalDeductions: true,
      },
      _count: {
        id: true,
      },
    });
  }

  if (previousSummary._sum.grossSalary && currentSummary._sum.grossSalary) {
    trends = {
      grossSalaryChange: (
        ((currentSummary._sum.grossSalary - previousSummary._sum.grossSalary) /
          previousSummary._sum.grossSalary) *
        100
      ).toFixed(2),
      netSalaryChange: (
        ((currentSummary._sum.netSalary - previousSummary._sum.netSalary) /
          previousSummary._sum.netSalary) *
        100
      ).toFixed(2),
      employeeCountChange: currentSummary._count.id - previousSummary._count.id,
    };
  }

  const departmentBreakdown = await prisma.payMaster.findMany({
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

  const deptSummary = departmentBreakdown.reduce((acc, record) => {
    const deptName = record.employee.department.name;
    if (!acc[deptName]) {
      acc[deptName] = {
        count: 0,
        totalGross: 0,
        totalNet: 0,
        totalDeductions: 0,
        avgSalary: 0,
      };
    }

    acc[deptName].count++,
      (acc[deptName].totalGross += Number.parseFloat(record.grossSalary));
    acc[deptName].totalNet += Number.parseFloat(record.netSalary);
    acc[deptName].totalDeductions += Number.parseFloat(record.totalDeductions);
    return acc;
  }, {});

  Object.keys(deptSummary).forEach((dept) => {
    deptSummary[dept].avgSalary =
      deptSummary[dept].totalNet / deptSummary[dept].count;
  });

  const typeSummary = departmentBreakdown.reduce((acc, record) => {
    const type = record.employee.type;
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        totalGross: 0,
        totalNet: 0,
      };
    }

    acc[type].count++,
      (acc[type].totalGross += Number.parseFloat(record.grossSalary)),
      (acc[type].totalNet += Number.parseFloat(record.netSalary));
    return acc;
  }, {});
  const roleSummary = departmentBreakdown.reduce((acc, record) => {
    const role = record.employee.role;
    if (!acc[role]) {
      acc[role] = {
        count: 0,
        totalGross: 0,
        totalNet: 0,
      };
    }

    acc[role].count++;
    acc[role].grossSalary += Number.parseFloat(record.grossSalary);
    acc[role].totalNet += Number.parseFloat(record.netSalary);
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        period: `${targetMonth}/${targetYear}`,
        summary: currentSummary,
        previousPeriod: previousSummary,
        trends,
        breadowns: {
          departments: deptSummary,
          employeeTypes: typeSummary,
          roles: roleSummary,
        },
      },
      "Salary summary with analytics fetched successfully"
    )
  );
});

const getPayrollTrends = asyncHandler(async (req, res) => {
  const { months = 6, year } = req.query;
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!hasPermission(currentUser.role, userType, "payroll:read")) {
    throw new ApiError(403, "Not have permission to view payroll analytics");
  }

  const currentDate = new Date();
  const startYear = year ? Number.parseInt(year) : currentDate.getFullYear();
  const monthToFetch = Number.parseInt(months);

  if (monthToFetch > 24) {
    throw new ApiError(400, "Cannot fetch trends form more than 24 months");
  }

  const trends = [];
  const baseWhereClause = { companyId };

  if (currentUser.role === "MANAGER" && userType === "employee") {
    const departmentEmployees = await prisma.employee.findMany({
      where: { departmentId: currentUser.departmentId, companyId },
      select: { id: true },
    });
    baseWhereClause.employeeId = {
      in: departmentEmployees.map((emp) => emp.id),
    };
  }

  for (let i = 0; i < monthToFetch; i++) {
    const targetDate = new Date(startYear, currentDate.getMonth() - i, 1);
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();

    const monthlyData = await prisma.payMaster.aggregate({
      where: {
        baseWhereClause,
        month,
        year,
      },
      _sum: {
        grossSalary: true,
        netSalary: true,
        totalDeductions: true,
        epf: true,
        esi: true,
        tds: true,
      },
      _count: { id: true },
      _avg: { netSalary: true },
    });

    trends.unshift({
      month,
      year,
      period: `${month}/${year}`,
      employeeCount: monthlyData._count.id,
      totalGross: monthlyData._sum.grossSalary || 0,
      totalNet: monthlyData._sum.netSalary || 0,
      totalDeductions: monthlyData._sum.totalDeductions || 0,
      avgNetSalary: monthlyData._avg.netSalary || 0,
      deductionBreakdown: {
        epf: monthlyData._sum.epf || 0,
        esi: monthlyData._sum.esi || 0,
        tds: monthlyData._sum.tds || 0,
      },
    });
  }

  const trendsWithGrowth = trends.map((trend, index) => {
    if (index === 0) return { ...trend, growth: null };

    const prevTrend = trends[index - 1];
    const growth = {
      grossSalary: prevTrend.totalGross
        ? (
            ((trend.totalGross - prevTrend.totalGross) / prevTrend.totalGross) *
            100
          ).toFixed(2)
        : 0,
      netSalary: prevTrend.totalNet
        ? (
            ((trend.totalNet - prevTrend.totalNet) / prevTrend.totalNet) *
            100
          ).toFixed(2)
        : 0,
      employeeCount: trend.employeeCount - prevTrend.employeeCount,
    };

    return { ...trend, growth };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        trendsWithGrowth,
        "Payroll trends fetched successfully"
      )
    );
});

const getPayrollCostAnalysis = asyncHandler(async (req, res) => {
  const { month, year, groupBy = "department" } = req.query;
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!hasPermission(currentUser.role, userType, "payroll:read")) {
    throw new ApiError(403, "Insufficient permissions to view cost analysis");
  }

  const targetMonth = month
    ? Number.parseInt(month)
    : new Date().getMonth() + 1;
  const targetYear = year ? Number.parseInt(year) : new Date().getFullYear();

  const whereClause = {
    companyId,
    month: targetMonth,
    year: targetYear,
  };

  if (currentUser.role === "MANAGER" && userType === "employee") {
    const departmentEmployees = await prisma.employee.findMany({
      where: { departmentId: currentUser.departmentId, companyId },
      select: { id: true },
    });
    whereClause.employeeId = { in: departmentEmployees.map((emp) => emp.id) };
  }

  const costAnalysis = await prisma.payMaster.findMany({
    where: whereClause,
    select: {
      basicSalary: true,
      da: true,
      ta: true,
      hra: true,
      spall: true,
      medicalAll: true,
      otherAll: true,
      epf: true,
      esi: true,
      tds: true,
      professionalTax: true,
      otherDeductions: true,
      grossSalary: true,
      netSalary: true,
      employee: {
        select: {
          role: true,
          type: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
    },
  });

  const componentTotals = costAnalysis.reduce(
    (acc, record) => {
      acc.basicSalary += Number.parseFloat(record.basicSalary);
      acc.da += Number.parseFloat(record.da);
      acc.ta += Number.parseFloat(record.ta);
      acc.hra += Number.parseFloat(record.hra);
      acc.spall += Number.parseFloat(record.spall);
      acc.medicalAll += Number.parseFloat(record.medicalAll);
      acc.otherAll += Number.parseFloat(record.otherAll);
      acc.epf += Number.parseFloat(record.epf);
      acc.esi += Number.parseFloat(record.esi);
      acc.tds += Number.parseFloat(record.tds);
      acc.professionalTax += Number.parseFloat(record.professionalTax);
      acc.otherDeductions += Number.parseFloat(record.otherDeductions);
      acc.grossSalary += Number.parseFloat(record.grossSalary);
      acc.netSalary += Number.parseFloat(record.netSalary);
      return acc;
    },
    {
      basicSalary: 0,
      da: 0,
      ta: 0,
      hra: 0,
      spall: 0,
      medicalAll: 0,
      otherAll: 0,
      epf: 0,
      esi: 0,
      tds: 0,
      professionalTax: 0,
      otherDeductions: 0,
      grossSalary: 0,
      netSalary: 0,
    }
  );

  let groupedAnalysis = {};

  if (groupBy === "department") {
    groupedAnalysis = costAnalysis.reduce((acc, record) => {
      const key = record.employee.department.name;
      if (!acc[key]) {
        acc[key] = { count: 0, totalGross: 0, totalNet: 0, totalDeductions: 0 };
      }
      acc[key].count++;
      acc[key].totalGross += Number.parseFloat(record.grossSalary);
      acc[key].totalNet += Number.parseFloat(record.netSalary);
      acc[key].totalDeductions +=
        Number.parseFloat(record.epf) +
        Number.parseFloat(record.esi) +
        Number.parseFloat(record.tds) +
        Number.parseFloat(record.professionalTax) +
        Number.parseFloat(record.otherDeductions);
      return acc;
    }, {});
  } else if (groupBy === "role") {
    groupedAnalysis = costAnalysis.reduce((acc, record) => {
      const key = record.employee.role;
      if (!acc[key]) {
        acc[key] = { count: 0, totalGross: 0, totalNet: 0 };
      }
      acc[key].count++;
      acc[key].totalGross += Number.parseFloat(record.grossSalary);
      acc[key].totalNet += Number.parseFloat(record.netSalary);
      return acc;
    }, {});
  } else if (groupBy === "type") {
    groupedAnalysis = costAnalysis.reduce((acc, record) => {
      const key = record.employee.type;
      if (!acc[key]) {
        acc[key] = { count: 0, totalGross: 0, totalNet: 0 };
      }
      acc[key].count++;
      acc[key].totalGross += Number.parseFloat(record.grossSalary);
      acc[key].totalNet += Number.parseFloat(record.netSalary);
      return acc;
    }, {});
  }

  const costPercentages = {
    allowances: {
      basic: (
        (componentTotals.basicSalary / componentTotals.grossSalary) *
        100
      ).toFixed(2),
      da: ((componentTotals.da / componentTotals.grossSalary) * 100).toFixed(2),
      ta: ((componentTotals.ta / componentTotals.grossSalary) * 100).toFixed(2),
      hra: ((componentTotals.hra / componentTotals.grossSalary) * 100).toFixed(
        2
      ),
      medical: (
        (componentTotals.medicalAll / componentTotals.grossSalary) *
        100
      ).toFixed(2),
    },
    deductions: {
      epf: ((componentTotals.epf / componentTotals.grossSalary) * 100).toFixed(
        2
      ),
      esi: ((componentTotals.esi / componentTotals.grossSalary) * 100).toFixed(
        2
      ),
      tds: ((componentTotals.tds / componentTotals.grossSalary) * 100).toFixed(
        2
      ),
      professionalTax: (
        (componentTotals.professionalTax / componentTotals.grossSalary) *
        100
      ).toFixed(2),
    },
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        period: `${targetMonth}/${targetYear}`,
        componentTotals,
        costPercentages,
        groupedAnalysis: {
          groupBy,
          data: groupedAnalysis,
        },
        totalEmployees: costAnalysis.length,
        averageCostPerEmployee:
          componentTotals.grossSalary / costAnalysis.length,
      },
      "Payroll cost analysis fetched successfully"
    )
  );
});

const getComplianceReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const userType = req.userType;

  if (!hasPermission(currentUser.role, userType, "payroll:read")) {
    throw new ApiError(
      403,
      "Insufficient permissions to view compliance report"
    );
  }

  const targetMonth = month
    ? Number.parseInt(month)
    : new Date().getMonth() + 1;
  const targetYear = year ? Number.parseInt(year) : new Date().getFullYear();

  const payrollData = await prisma.payMaster.findMany({
    where: {
      companyId,
      month: targetMonth,
      year: targetYear,
    },
    include: {
      employee: {
        select: {
          name: true,
          employeeCode: true,
          type: true,
          salary: true,
        },
      },
    },
  });

  const complianceIssues = [];

  const complianceStats = {
    totalEmployees: payrollData.length,
    epfCompliant: 0,
    esiCompliant: 0,
    minimumWageCompliant: 0,
    issues: [],
  };

  const minimumWage = 15000;

  payrollData.forEach((record) => {
    const employee = record.employee;

    // EPF Compliance (12% of basic salary for eligible employees)
    if (employee.type === "PERMANENT" || employee.type === "CONTRACT") {
      const expectedEpf = record.basicSalary * 0.12;
      const actualEpf = Number.parseFloat(record.epf);

      if (Math.abs(expectedEpf - actualEpf) > 1) {
        // Allow for rounding differences
        complianceIssues.push({
          employeeCode: employee.employeeCode,
          employeeName: employee.name,
          issue: "EPF calculation mismatch",
          expected: expectedEpf,
          actual: actualEpf,
        });
      } else {
        complianceStats.epfCompliant++;
      }
    }

    // Minimum wage compliance
    if (record.basicSalary >= minimumWage) {
      complianceStats.minimumWageCompliant++;
    } else {
      complianceIssues.push({
        employeeCode: employee.employeeCode,
        employeeName: employee.name,
        issue: "Below minimum wage",
        actual: record.basicSalary,
        minimum: minimumWage,
      });
    }

    // ESI Compliance (0.75% of gross salary for eligible employees)
    if (
      record.grossSalary <= 25000 &&
      (employee.type === "PERMANENT" || employee.type === "CONTRACT")
    ) {
      const expectedEsi = record.grossSalary * 0.0075;
      const actualEsi = Number.parseFloat(record.esi);

      if (Math.abs(expectedEsi - actualEsi) > 1) {
        complianceIssues.push({
          employeeCode: employee.employeeCode,
          employeeName: employee.name,
          issue: "ESI calculation mismatch",
          expected: expectedEsi,
          actual: actualEsi,
        });
      } else {
        complianceStats.esiCompliant++;
      }
    }
  });

  complianceStats.issues = complianceIssues;
  complianceStats.complianceScore = (
    ((complianceStats.epfCompliant +
      complianceStats.esiCompliant +
      complianceStats.minimumWageCompliant) /
      (complianceStats.totalEmployees * 3)) *
    100
  ).toFixed(2);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        period: `${targetMonth}/${targetYear}`,
        complianceStats,
        issues: complianceIssues,
        recommendations:
          complianceIssues.length > 0
            ? [
                "Review pay parameter configurations",
                "Ensure minimum wage compliance",
                "Verify EPF and ESI calculations",
                "Update employee types if necessary",
              ]
            : ["All compliance checks passed"],
      },
      "Compliance report generated successfully"
    )
  );
});

export {
  getSalarySummary,
  getPayrollCostAnalysis,
  getComplianceReport,
  getPayrollTrends,
};

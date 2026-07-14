import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getAnalyticsDashboard = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const { companyId } = req.user;

  if (!companyId) {
    throw new ApiError(401, "Company ID is required");
  }

  const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  // 1. Employee Statistics
  const [totalEmployees, activeEmployees, genderCounts, typeCounts] = await Promise.all([
    prisma.employee.count({ where: { companyId } }),
    prisma.employee.count({ where: { companyId, isActive: true } }),
    prisma.employee.groupBy({
      by: ['gender'],
      where: { companyId },
      _count: { id: true }
    }),
    prisma.employee.groupBy({
      by: ['type'],
      where: { companyId, isActive: true },
      _count: { id: true }
    })
  ]);

  const genderBreakdown = { MALE: 0, FEMALE: 0, OTHER: 0 };
  genderCounts.forEach(g => {
    if (g.gender in genderBreakdown) {
      genderBreakdown[g.gender] = g._count.id;
    }
  });

  // 2. Attendance Status Breakdown for the month
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 1);

  const attendanceStats = await prisma.attendance.groupBy({
    by: ['status'],
    where: {
      companyId,
      date: {
        gte: startDate,
        lt: endDate
      }
    },
    _count: { id: true }
  });

  const attendanceBreakdown = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0, WEEK_OFF: 0, HOLIDAY: 0, LATE: 0, EARLY_LEAVE: 0 };
  attendanceStats.forEach(a => {
    if (a.status in attendanceBreakdown) {
      attendanceBreakdown[a.status] = a._count.id;
    }
  });

  // 3. Leave Application Statistics for the month
  const leaveStats = await prisma.leaveApplication.groupBy({
    by: ['status'],
    where: {
      companyId,
      appliedAt: {
        gte: startDate,
        lt: endDate
      }
    },
    _count: { id: true }
  });

  const leaveBreakdown = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 };
  leaveStats.forEach(l => {
    if (l.status in leaveBreakdown) {
      leaveBreakdown[l.status] = l._count.id;
    }
  });

  // 4. Payroll Statistics for the month
  const payrollSummary = await prisma.payMaster.aggregate({
    where: { companyId, month: targetMonth, year: targetYear },
    _sum: {
      grossSalary: true,
      totalDeductions: true,
      netSalary: true,
    },
    _avg: {
      netSalary: true,
    },
    _count: { id: true }
  });

  // 5. Department Breakdown from PayMaster
  const salaries = await prisma.payMaster.findMany({
    where: { companyId, month: targetMonth, year: targetYear },
    include: {
      employee: {
        select: {
          department: { select: { name: true } },
          type: true,
          role: true
        }
      }
    }
  });

  const departmentBreakdown = {};
  salaries.forEach(s => {
    const deptName = s.employee.department?.name || "Unassigned";
    if (!departmentBreakdown[deptName]) {
      departmentBreakdown[deptName] = {
        name: deptName,
        count: 0,
        totalGross: 0,
        totalNet: 0,
        totalDeductions: 0
      };
    }
    departmentBreakdown[deptName].count++;
    departmentBreakdown[deptName].totalGross += Number(s.grossSalary);
    departmentBreakdown[deptName].totalNet += Number(s.netSalary);
    departmentBreakdown[deptName].totalDeductions += Number(s.totalDeductions);
  });

  // 6. Employee Type Breakdown from PayMaster
  const typeBreakdown = {};
  salaries.forEach(s => {
    const typeName = s.employee.type || "UNKNOWN";
    if (!typeBreakdown[typeName]) {
      typeBreakdown[typeName] = {
        name: typeName,
        count: 0,
        totalGross: 0,
        totalNet: 0,
        totalDeductions: 0
      };
    }
    typeBreakdown[typeName].count++;
    typeBreakdown[typeName].totalGross += Number(s.grossSalary);
    typeBreakdown[typeName].totalNet += Number(s.netSalary);
    typeBreakdown[typeName].totalDeductions += Number(s.totalDeductions);
  });

  // 7. Role Breakdown from PayMaster
  const roleBreakdown = {};
  salaries.forEach(s => {
    const roleName = s.employee.role || "UNKNOWN";
    if (!roleBreakdown[roleName]) {
      roleBreakdown[roleName] = {
        name: roleName,
        count: 0,
        totalGross: 0,
        totalNet: 0,
        totalDeductions: 0
      };
    }
    roleBreakdown[roleName].count++;
    roleBreakdown[roleName].totalGross += Number(s.grossSalary);
    roleBreakdown[roleName].totalNet += Number(s.netSalary);
    roleBreakdown[roleName].totalDeductions += Number(s.totalDeductions);
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        period: `${targetMonth}/${targetYear}`,
        employeeStats: {
          total: totalEmployees,
          active: activeEmployees,
          gender: genderBreakdown,
          types: typeCounts.map(t => ({ name: t.type, count: t._count.id }))
        },
        attendanceStats: attendanceBreakdown,
        leaveStats: leaveBreakdown,
        payrollStats: {
          totalGross: payrollSummary._sum.grossSalary || 0,
          totalDeductions: payrollSummary._sum.totalDeductions || 0,
          totalNet: payrollSummary._sum.netSalary || 0,
          avgNet: payrollSummary._avg.netSalary || 0,
          payoutCount: payrollSummary._count.id || 0
        },
        breakdowns: {
          departments: Object.values(departmentBreakdown),
          employeeTypes: Object.values(typeBreakdown),
          roles: Object.values(roleBreakdown)
        }
      },
      "Dashboard analytics overview fetched successfully"
    )
  );
});

export { getAnalyticsDashboard };

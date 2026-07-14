import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import prisma from "../../config/prismaClient.js";
import dayjs from "dayjs";

const clockIn = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.companyId;

  if (!userId || !companyId) {
    throw new ApiError(400, "Invalid request. Please login again.");
  }

  const today = dayjs().startOf("day").toDate();

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: userId,
        date: today,
      },
    },
  });

  if (existingAttendance) {
    throw new ApiError(400, "Already clocked in for today");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
    include: { attendancePlan: true },
  });

  if (!employee || !employee.attendancePlan) {
    throw new ApiError(400, "Attendance plan not assigned");
  }

  const now = dayjs();
  const shiftStart = dayjs(
    `${now.format("YYYY-MM-DD")}T${employee.attendancePlan.shiftStartTime}`
  );
  const graceLimit = shiftStart.add(
    employee.attendancePlan.gracePeriodMins || 0,
    "minute"
  );

  let status = "PRESENT";
  if (now.isAfter(graceLimit)) {
    status = "LATE";
  }

  const newAttendance = await prisma.attendance.create({
    data: {
      employeeId: userId,
      companyId,
      date: today,
      inTime: now.toDate(),
      status,
      isApproved: true,
      approvedById: userId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newAttendance, "Clock-in successful"));
});

const clockOut = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(400, "Invalid request. Please login again.");
  }

  const today = dayjs().startOf("day").toDate();

  const attendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: userId,
        date: today,
      },
    },
    include: {
      employee: {
        include: { attendancePlan: true },
      },
    },
  });

  if (!attendance) {
    throw new ApiError(400, "Please clock in first");
  }

  if (attendance.outTime) {
    throw new ApiError(400, "Already clocked out for today");
  }

  const now = dayjs();
  const inTime = dayjs(attendance.inTime);

  const totalMinutes = now.diff(inTime, "minute");
  const totalHours = parseFloat((totalMinutes / 60).toFixed(2));

  if (totalHours <= 0) {
    throw new ApiError(400, "Clock-out time cannot be before clock-in time");
  }

  const { attendancePlan } = attendance.employee;

  let finalStatus = attendance.status;

  // Check if punch out is required
  if (attendancePlan.requirePunchOut) {
    const requiredHours = parseFloat(attendancePlan.workingHours);
    if (totalHours < requiredHours) {
      finalStatus = "EARLY_LEAVE";
    } else if (finalStatus !== "LATE") {
      finalStatus = "PRESENT";
    }
  }

  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      outTime: now.toDate(),
      totalHours,
      status: finalStatus,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAttendance, "Clock-out successful"));
});

const getAllAttendance = asyncHandler(async (req, res) => {
  const { companyId } = req.user;
  const { from, to, employeeId, page = 1, limit = 20 } = req.query;

  if (req.userType !== "admin" && !["HR", "MANAGER"].includes(req.user.role)) {
    throw new ApiError(
      403,
      "Only Admin, HR and Manager can access all attendance records"
    );
  }

  const filters = {
    companyId,
    ...(employeeId && { employeeId: Number(employeeId) }),
    ...(from &&
      to && {
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      }),
  };

  const [attendances, totalCount] = await Promise.all([
    prisma.attendance.findMany({
      where: filters,
      orderBy: { date: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: Number(limit),
    }),
    prisma.attendance.count({ where: filters }),
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { attendances, totalCount, page, limit },
        "Attendance fetched successfully"
      )
    );
});

const getOwnAttendance = asyncHandler(async (req, res) => {
  const { id: employeeId, companyId } = req.user;
  const { from, to, page = 1, limit = 20 } = req.query;

  const filters = {
    companyId,
    employeeId,
    ...(from &&
      to && {
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      }),
  };

  const [attendances, totalCount] = await Promise.all([
    prisma.attendance.findMany({
      where: filters,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: Number(limit),
    }),
    prisma.attendance.count({ where: filters }),
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { attendances, totalCount, page, limit },
        "Your attendance fetched successfully"
      )
    );
});

const getClockStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = dayjs().startOf("day").toDate();

  const attendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: userId,
        date: today,
      },
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isClockedIn: !!attendance && !attendance.outTime,
        attendance: attendance || null,
      },
      "Clock status fetched successfully"
    )
  );
});

export { clockIn, clockOut, getAllAttendance, getOwnAttendance, getClockStatus };


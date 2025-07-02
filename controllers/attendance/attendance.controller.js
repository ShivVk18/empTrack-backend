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
        date: today
      }
    }
  });

  if (existingAttendance) {
    throw new ApiError(400, "Already clocked in for today");
  }

  const newAttendance = await prisma.attendance.create({
    data: {
      employeeId: userId,
      companyId,
      date: today,
      inTime: new Date(),
      status: "PRESENT",
      isApproved: true,
      approvedById: userId
    }
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

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: userId,
        date: today
      }
    }
  });

  if (!existingAttendance) {
    throw new ApiError(400, "Please clock in first");
  }

  if (existingAttendance.outTime) {
    throw new ApiError(400, "Already clocked out for today");
  }

  const now = dayjs();
  const inTime = dayjs(existingAttendance.inTime);

  const totalHours = now.diff(inTime, "minute") / 60;

  if (totalHours <= 0) {
    throw new ApiError(400, "Clock-out time cannot be before clock-in time");
  }

  const updatedAttendance = await prisma.attendance.update({
    where: { id: existingAttendance.id },
    data: {
      outTime: now.toDate(),
      totalHours: parseFloat(totalHours.toFixed(2))
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAttendance, "Clock-out successful"));
});


const getAllAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, employeeId, date } = req.query;
  const skip = (page - 1) * limit;

  if (isNaN(page) || isNaN(limit)) {
    throw new ApiError(400, "Page and limit must be numbers");
  }

  const filters = {
    companyId: req.user.companyId
  };

  if (status) filters.status = status;
  if (employeeId) filters.employeeId = +employeeId;
  if (date) {
    const filterDate = dayjs(date).startOf("day").toDate();
    filters.date = filterDate;
  }

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where: filters,
      skip: +skip,
      take: +limit,
      orderBy: { date: "desc" },
      include: { employee: true }
    }),
    prisma.attendance.count({ where: filters })
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { attendances, total }, "Attendance fetched"));
});


const getOwnAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required");
  }

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).endOf("day");

  if (!start.isValid() || !end.isValid()) {
    throw new ApiError(400, "Invalid date format");
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: userId,
      companyId: req.user.companyId,
      date: {
        gte: start.toDate(),
        lte: end.toDate()
      }
    },
    orderBy: { date: "asc" }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, attendances, "Attendance fetched"));
});


export {clockIn,clockOut,getAllAttendance,getOwnAttendance}  
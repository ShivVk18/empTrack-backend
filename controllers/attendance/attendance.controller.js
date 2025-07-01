import prisma from "../../config/prismaClient";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import dayjs from "dayjs";


const clockIn = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  if (["HR", "MANAGER", "SR_MANAGER", "ACCOUNTANT"].includes(userRole)) {
    throw new ApiError(403, "Only employees can clock in");
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
    throw new ApiError(400, "You have already clocked in today");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
    include: { attendancePlan: true },
  });

  if (!employee.attendancePlan) {
    throw new ApiError(400, "No attendance plan assigned");
  }

  const now = new Date();
  const [shiftHour, shiftMinute] = employee.attendancePlan.shiftStartTime
    .split(":")
    .map(Number);

  const shiftStartTime = dayjs(today).hour(shiftHour).minute(shiftMinute).second(0);
  const lateThreshold = shiftStartTime.add(employee.attendancePlan.allowedLateMins || 0, "minute");

  let status = "PRESENT";

  if (dayjs(now).isAfter(lateThreshold)) {
    status = "LATE";
  }

  await prisma.attendance.create({
    data: {
      employeeId: userId,
      date: today,
      inTime: now,
      status,
      isApproved: true, 
      approvedById: userId,
    },
  });

  res.status(201).json(new ApiResponse(200, status, "Clock-in successful"));
});


const clockOut = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  if (["HR", "MANAGER", "SR_MANAGER", "ACCOUNTANT"].includes(userRole)) {
    throw new ApiError(403, "Only employees can clock out");
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

  if (!existingAttendance) {
    throw new ApiError(400, "You have not clocked in yet");
  }

  if (existingAttendance.outTime) {
    throw new ApiError(400, "You have already clocked out today");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
    include: { attendancePlan: true },
  });

  if (!employee.attendancePlan) {
    throw new ApiError(400, "No attendance plan assigned");
  }

  const now = dayjs();
  const inTime = dayjs(existingAttendance.inTime);

  const totalWorkingHours = now.diff(inTime, "minute") / 60;

  let status = "PRESENT";

  if (totalWorkingHours < employee.attendancePlan.workingHours && !employee.attendancePlan.allowEarlyLeave) {
    status = "EARLY_LEAVE";
  }

  await prisma.attendance.update({
    where: { id: existingAttendance.id },
    data: {
      outTime: now.toDate(),
      totalHours: totalWorkingHours.toFixed(2),
      status,
      isApproved: true, 
      approvedById: userId,
    },
  });

  res.status(201).json(new ApiResponse(200, status, "Clock-out successful"));
});

const getAllAttendance = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userType = req.userType;

  if (!["HR", "SR_MANAGER", "MANAGER"].includes(userRole) && userType !== "admin") {
    throw new ApiError(403, "Access denied");
  }

  const { employeeName, departmentId, status, startDate, endDate, page = 1, limit = 10 } = req.query;

  const filters = {};

  
  const employeeFilters = {
    companyId: req.user.companyId,
  };

  if (employeeName) {
    employeeFilters.name = { contains: employeeName, mode: "insensitive" };
  }

  if (departmentId) {
    employeeFilters.departmentId = Number(departmentId);
  }

 
  if (userRole === "MANAGER") {
    employeeFilters.departmentId = req.user.departmentId;
  }

  const matchingEmployees = await prisma.employee.findMany({
    where: employeeFilters,
    select: { id: true },
  });

  const employeeIds = matchingEmployees.map((emp) => emp.id);

  
  if (employeeIds.length > 0) {
    filters.employeeId = { in: employeeIds };
  } else if (employeeName || departmentId || userRole === "MANAGER") {
    
    return res.status(200).json(new ApiResponse(200, {
      totalRecords: 0,
      totalPages: 0,
      currentPage: Number(page),
      records: [],
    }, "Attendance records fetched successfully"));
  }

  if (status) {
    filters.status = status;
  }

  if (startDate && endDate) {
    filters.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const attendanceRecords = await prisma.attendance.findMany({
    where: filters,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          department: {
            select: { name: true },
          },
        },
      },
    },
    skip,
    take: Number(limit),
    orderBy: {
      date: "desc",
    },
  });

  const totalRecords = await prisma.attendance.count({
    where: filters,
  });

  res.status(200).json(
    new ApiResponse(200, {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      records: attendanceRecords,
    }, "Attendance records fetched successfully")
  );
});

const getOwnAttendance = asyncHandler(async(req,res)=> {
     const userId = req.user.id
     const userRole = req.user.role 

    if (["HR", "MANAGER", "SR_MANAGER", "ACCOUNTANT"].includes(userRole)) {
    throw new ApiError(403, "Only employees can see there attendance");
  }


  const {month,year} = req.query

  if (!month || !year) {
    throw new ApiError(400, "Month and year are required");
  }
  
 const startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
 const endDate = dayjs(startDate).endOf("month").toDate();
   

 const attenDanceRecords = await prisma.attendance.findMany({
    where:{
         employeeId:userId,
         date:{
            gte:startDate,
            lte:endDate
         }
    },
    orderBy:{
        date:'asc'
    }
 })

  const summary = {
    totalDays: dayjs(endDate).date(),
    presentDays:0,
    absentDays:0,
    lateDays:0,
    earlyLeaveDays:0,
    leaveDays:0
  } 

  const formattedRecords = attenDanceRecords.map((record)=> {
    if (record.status === "PRESENT") summary.presentDays += 1;
    else if (record.status === "ABSENT") summary.absentDays += 1;
    else if (record.status === "LATE") summary.lateDays += 1;
    else if (record.status === "EARLY_LEAVE") summary.earlyLeaveDays += 1;
    else if (record.status === "LEAVE") summary.leaveDays += 1;

    return {
      date: dayjs(record.date).format("YYYY-MM-DD"),
      status: record.status,
      inTime: record.inTime,
      outTime: record.outTime,
      totalHours: record.totalHours,
    };
  })
   

  res.status(200).json(
    new ApiResponse(200,{
      summary,
      attendanceRecord : formattedRecords
    },"Attendance fetched successfully")
  )
     
})

export {clockIn,clockOut,getAllAttendance,getOwnAttendance}  
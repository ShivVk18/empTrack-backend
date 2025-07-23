import { asyncHandler } from "../../utils/asyncHandler.js";
import prisma from "../../config/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const createHoliday = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;

  const { holidayName, date, isCompanySpecific } = req.body;

  const existingHoliday = await prisma.holiday.findFirst({
    where: {
      name: holidayName,
      date: new Date(date),
      companyId: companyId,
    },
  });

  if (existingHoliday) {
    throw new ApiError(401, "Holiday already existed");
  }

  const holiday = await prisma.holiday.create({
    data: {
      name: holidayName,
      date: new Date(date),
      companyId: companyId,
      isCompanySpecific: isCompanySpecific || true,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, holiday, "Holiday created successfully"));
});


const getAllHoliday = asyncHandler(async(req,res)=>{
    const companyId = req.user.companyId;

    const { startDate, endDate, isCompanySpecific, page = 1, limit = 12 } = req.query;
    
    const filters = { companyId };

    if (startDate && endDate) {
        filters.date = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        };
    }

    if (isCompanySpecific !== undefined) {
        filters.isCompanySpecific = isCompanySpecific === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);  

    const allHolidays = await prisma.holiday.findMany({
        where: filters,
        skip,
        take: Number(limit),
        orderBy: { date: "desc" },
    });

    const totalRecord = await prisma.holiday.count({ where: filters });

    return res.status(200).json(new ApiResponse(
        200,
        { totalRecord, records: allHolidays },
        "All holidays fetched successfully"
    ));
});


const deleteHoliday = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const { holidayId } = req.params;

  if (!holidayId) {
    throw new ApiError(400, "Holiday id is required");
  }

  const existingHoliday = await prisma.holiday.findFirst({
    where: {
      id: Number(holidayId),
      companyId: companyId,
    },
  });

  if (!existingHoliday) {
    throw new ApiError(404, "No holiday found");
  }

  await prisma.holiday.delete({
    where: {
      id: existingHoliday.id,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Holiday deleted successfully"));
});


export{createHoliday,getAllHoliday,deleteHoliday}
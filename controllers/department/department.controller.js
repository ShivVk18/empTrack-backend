import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const addDepartment = asyncHandler(async (req, res) => {
  const { departmentName, departmentCode } = req.body;

  if (!departmentName || !departmentCode) {
    throw new ApiError(400, "All fields are required");
  }

  const companyId = req.user?.companyId;

  const existingDepartment = await prisma.department.findFirst({
    where: {
      companyId: companyId,
      name: departmentName,
      code: departmentCode,
    },
  });

  if (existingDepartment) {
    throw new ApiError(400, "The name of this department already exist");
  }

  try {
    const department = await prisma.department.create({
      data: {
        name: departmentName,
        code: departmentCode,
        companyId: companyId,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { department }, "Department added successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Failed to add department");
  }
});

const getAllDepartments = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId ;

  try {
    const allDepartments = await prisma.department.findMany({
      where: { companyId: companyId },
      orderBy: { name: "asc" },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          allDepartments,
          "All department fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to fetch all department");
  }
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const departmentCode = req.params?.code;

  const department = await prisma.department.findFirst({
    where: {
      companyId,
      code: departmentCode,
    },
  });

  if (!department) {
    throw new ApiError(404, "Department not found");
  }
  try {
    await prisma.department.delete({
      where: {
        id: department.id,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Department deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to delete department");
  }
});


export {addDepartment,getAllDepartments,deleteDepartment}
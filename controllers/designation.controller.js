import prisma from "../config/prismaClient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addDesignation = asyncHandler(async (req, res) => {
  const { designationName,designationCode } = req.body;

  if (!designationName || !designationCode) {
    throw new ApiError(400, "All fields are required");
  }

  const companyId = req.user?.companyId;

  const existingDesignation = await prisma.designation.findFirst({
    where: {
      companyId: companyId,
      name: designationName,
      code: designationCode,
    },
  });

  if (existingDesignation) {
    throw new ApiError(400, "The name of this designation already exist");
  }

  try {
    const designation = await prisma.designation.create({
      data: {
        name: designationName,
        code: designationCode,
        companyId: companyId,
      },
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, { designation }, "Designation added successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Failed to add designation");
  }
});

const getAllDesignations = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;

  try {
    const allDesignations = await prisma.designation.findMany({
      where: { companyId: companyId },
      orderBy: { name: "asc" },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          allDesignations,
          "All designations fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to fetch all designation");
  }
});

const deleteDesignation = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;
  const designationCode = req.params?.code;

  const designation = await prisma.designation.findFirst({
    where: {
      companyId,
      code: designationCode,
    },
  });

  if (!designation) {
    throw new ApiError(404, "Designation not found");
  }
  try {
    await prisma.designation.delete({
      where: {
        id: designation.id,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Designation deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to delete designation");
  }
});

export {addDesignation,getAllDesignations,deleteDesignation}

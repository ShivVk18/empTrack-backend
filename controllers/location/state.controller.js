import prisma from "../../config/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getStatesDropdown = asyncHandler(async (req, res) => {
  const states = await prisma.state.findMany({
    select: {
      id: true,
      stateName: true,
    },
    orderBy: { stateName: "asc" },
  });

  if (!states || states.length === 0) {
    throw new ApiError(404, "No states found");
  }

  const dropdownData = states.map((state) => ({
    value: state.stateName,
    label: state.id,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        dropdownData,
        "States dropdown data fetched successfully"
      )
    );
});

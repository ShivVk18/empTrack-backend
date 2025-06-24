import prisma from "../../config/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getCitiesDropdown = asyncHandler(async (req, res) => {
  const { stateId } = req.params;

  const parsedStateId = Number.parseInt(stateId);
  if (isNaN(parsedStateId)) {
    throw new ApiError(400, "Invalid State ID format");
  }

  
  const stateExists = await prisma.state.findUnique({
    where: { id: parsedStateId },
    select: { id: true, stateName: true },
  });

  if (!stateExists) {
    throw new ApiError(404, "State not found");
  }

  const cities = await prisma.city.findMany({
    where: { stateId: parsedStateId },
    select: {
      id: true,
      cityName: true,
      stateId: true,
    },
    orderBy: { cityName: "asc" },
  });

  if (!cities || cities.length === 0) {
    throw new ApiError(404, `No cities found for ${stateExists.stateName}`);
  }

  const dropdownData = cities.map((city) => ({
    value: city.id,
    label: city.cityName,
    stateId: city.stateId,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        dropdownData,
        `Cities for ${stateExists.stateName} fetched successfully`
      )
    );
});

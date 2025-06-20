import prisma from "../../config/prismaClient.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"  


export const getBankCodesDropdown = asyncHandler(async (req, res) => {
  const bankCodes = await prisma.bankCode.findMany({
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: { name: "asc" },
  })

  if (!bankCodes || bankCodes.length === 0) {
    throw new ApiError(404, "No bank codes found")
  }

  
  const dropdownData = bankCodes.map((bank) => ({
    value: bank.id,
    label: `${bank.code} - ${bank.name}`,
    code: bank.code,
    name: bank.name,
  }))

  return res.status(200).json(new ApiResponse(200, dropdownData, "Bank codes dropdown data fetched successfully"))
})

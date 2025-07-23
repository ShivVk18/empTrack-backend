import prisma from "../../config/prismaClient.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"

const validEmployeeTypes = ["PERMANENT", "CONTRACT", "INTERN", "CONSULTANT", "PART_TIME", "TEMPORARY"]

const percentageFields = [
  "da",
  "ta",
  "hra",
  "spall",
  "medicalAllRate",
  "epfRate",
  "esiRate",
  "tdsRate",
  "professionalTaxRate",
]

const validatePercentages = (fields) => {
  for (const key of percentageFields) {
    if (fields[key] !== undefined && (fields[key] < 0 || fields[key] > 100)) {
      throw new ApiError(400, `${key} must be between 0 and 100`)
    }
  }
}

const createPayParameter = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId
  const {
    employeeType,
    medicalAllFixed,
    esiSalaryLimit,
    epfSalaryLimit,
    paidLeavePerMonth,
    unpaidLeavePenaltyPerDay,
    effectiveDate,
    ...percentages
  } = req.body

  if (!companyId) throw new ApiError(403, "Unauthorized access")

  if (!employeeType || !validEmployeeTypes.includes(employeeType))
    throw new ApiError(400, "Invalid or missing Employee Type")

  // Check for existing employeeType with same effective date
  const existingParam = await prisma.payParameter.findFirst({
    where: {
      companyId,
      employeeType,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
    },
  })

  if (existingParam)
    throw new ApiError(400, `Pay parameter for '${employeeType}' with this effective date already exists`)

  validatePercentages(percentages)
   
  const existingParameter = await prisma.payParameter.findFirst({
    where:{
      companyId:companyId,
      employeeType:employeeType
    }
  })

  if(existingParam){
    throw new ApiError(400,"Payparameter already existed")
  }


  const payParameter = await prisma.payParameter.create({
    data: {
      companyId,
      employeeType,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      ...percentages,
      medicalAllFixed: medicalAllFixed || 0,
      esiSalaryLimit: esiSalaryLimit || 25000,
      epfSalaryLimit: epfSalaryLimit || 15000,
      paidLeavePerMonth: paidLeavePerMonth || 1.0,
      unpaidLeavePenaltyPerDay: unpaidLeavePenaltyPerDay || 0,
    },
    include: {
      company: { select: { name: true } },
    },
  })

  return res.status(201).json(new ApiResponse(201, payParameter, "Pay parameter created successfully"))
})

const getPayParameters = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId
  if (!companyId) throw new ApiError(403, "Unauthorized access")

  const { page, limit, employeeType } = req.query

  const where = { companyId }
  if (employeeType) where.employeeType = employeeType

  const queryOptions = {
    where,
    include: {
      company: { select: { name: true } },
    },
    orderBy: [{ employeeType: "asc" }, { effectiveDate: "desc" }],
  }

  if (page && limit) {
    queryOptions.skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    queryOptions.take = Number.parseInt(limit)
  }

  const [payParameters, totalCount] = await Promise.all([
    prisma.payParameter.findMany(queryOptions),
    page && limit ? prisma.payParameter.count({ where }) : null,
  ])

  const response = { payParameters }

  if (page && limit) {
    response.pagination = {
      currentPage: Number.parseInt(page),
      totalPages: Math.ceil(totalCount / Number.parseInt(limit)),
      totalCount,
      hasNext: Number.parseInt(page) * Number.parseInt(limit) < totalCount,
      hasPrev: Number.parseInt(page) > 1,
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        response,
        payParameters.length > 0 ? "Pay parameters fetched successfully" : "No pay parameters found",
      ),
    )
})

const getPayParameterById = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId
  const { id } = req.params

  if (!companyId) throw new ApiError(403, "Unauthorized access")
  if (!id) throw new ApiError(400, "Pay parameter ID is required")

  const payParameter = await prisma.payParameter.findFirst({
    where: {
      id: Number.parseInt(id),
      companyId,
    },
    include: {
      company: { select: { name: true } },
    },
  })

  if (!payParameter) throw new ApiError(404, `Pay parameter with ID ${id} not found`)

  return res.status(200).json(new ApiResponse(200, payParameter, "Pay parameter fetched successfully"))
})

const getPayParametersByType = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId
  const { employeeType } = req.params

  if (!companyId) throw new ApiError(403, "Unauthorized access")
  if (!employeeType) throw new ApiError(400, "Employee type is required")

  // Get the most recent pay parameter for this employee type
  const payParameter = await prisma.payParameter.findFirst({
    where: { employeeType, companyId },
    orderBy: { effectiveDate: "desc" },
    include: {
      company: { select: { name: true } },
    },
  })

  if (!payParameter) throw new ApiError(404, `Pay parameter for ${employeeType} not found`)

  return res.status(200).json(new ApiResponse(200, payParameter, "Pay parameter fetched successfully"))
})

const updatePayParameter = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId
  const { id } = req.params

  if (!companyId) throw new ApiError(403, "Unauthorized access")
  if (!id) throw new ApiError(400, "Pay parameter ID is required")

  const existingParam = await prisma.payParameter.findFirst({
    where: { id: Number.parseInt(id), companyId },
  })

  if (!existingParam) throw new ApiError(404, "Pay parameter not found")

  const updateData = {}

  // Handle employeeType update
  if (req.body.employeeType !== undefined) {
    if (!validEmployeeTypes.includes(req.body.employeeType)) {
      throw new ApiError(400, "Invalid Employee Type")
    }

    // Check for duplicate if changing employee type
    if (req.body.employeeType !== existingParam.employeeType) {
      const duplicateCheck = await prisma.payParameter.findFirst({
        where: {
          companyId,
          employeeType: req.body.employeeType,
          effectiveDate: existingParam.effectiveDate,
          id: { not: Number.parseInt(id) },
        },
      })

      if (duplicateCheck) {
        throw new ApiError(400, `Pay parameter for '${req.body.employeeType}' with this effective date already exists`)
      }
    }

    updateData.employeeType = req.body.employeeType
  }
  
  ;[
    ...percentageFields,
    "medicalAllFixed",
    "esiSalaryLimit",
    "epfSalaryLimit",
    "paidLeavePerMonth",
    "unpaidLeavePenaltyPerDay",
    "effectiveDate",
  ].forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "effectiveDate") {
        updateData[field] = new Date(req.body[field])
      } else {
        updateData[field] = req.body[field]
      }
    }
  })

  if (Object.keys(updateData).length === 0) throw new ApiError(400, "No valid fields to update")

  // Validate percentages
  const percentageUpdates = {}
  percentageFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      percentageUpdates[field] = updateData[field]
    }
  })

  if (Object.keys(percentageUpdates).length > 0) {
    validatePercentages(percentageUpdates)
  }

  const updatedPayParameter = await prisma.payParameter.update({
    where: { id: Number.parseInt(id) },
    data: updateData,
    include: {
      company: { select: { name: true } },
    },
  })

  return res.status(200).json(new ApiResponse(200, updatedPayParameter, "Pay parameter updated successfully"))
})

const deletePayParameter = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId
  const { id } = req.params

  if (!companyId) throw new ApiError(403, "Unauthorized access")
  if (!id) throw new ApiError(400, "Pay parameter ID is required")

  const payParameter = await prisma.payParameter.findFirst({
    where: { id: Number.parseInt(id), companyId },
  })

  if (!payParameter) throw new ApiError(404, "Pay parameter not found")

  
  const payrollCount = await prisma.payMaster.count({
    where: {
      companyId,
      employee: { type: payParameter.employeeType },
    },
  })

  if (payrollCount > 0) throw new ApiError(400, "Cannot delete pay parameter that has been used in payroll generation")

  await prisma.payParameter.delete({ where: { id: Number.parseInt(id) } })

  return res.status(200).json(new ApiResponse(200, {}, "Pay parameter deleted successfully"))
})

export {
  createPayParameter,
  getPayParameters,
  getPayParametersByType,
  updatePayParameter,
  deletePayParameter,
  getPayParameterById,
}

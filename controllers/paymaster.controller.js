import prisma from "../config/prismaClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateSalary = asyncHandler(async (req, res) => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const companyId = req.user?.companyId

  if (!companyId) {
    throw new ApiError(401, "Company ID is required")
  }

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: {
      companyId: companyId,
      isActive: true,
    },
    select: {
      id: true,
      employeeCode: true,
      name: true,
      departmentId: true,
      designationId: true,
      salary: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  })

  if (employees.length === 0) {
    throw new ApiError(404, "No active employees found")
  }

  // Use transaction for bulk operations
  const paymasters = await prisma.$transaction(async (tx) => {
    const paymasterData = []

    for (const employee of employees) {
      const { departmentId, designationId } = employee
      const basicSalary = employee.salary

      if (!basicSalary || basicSalary <= 0) {
        continue
      }

      // Find pay parameters
      const payParam = await tx.payParameter.findFirst({
        where: {
          companyId: companyId,
          departmentId: departmentId,
          designationId: designationId,
        },
      })

      if (!payParam) {
        continue
      }

      // Check if already exists
      const alreadyExists = await tx.payMaster.findFirst({
        where: {
          employeeId: employee.id,
          month: currentMonth,
          year: currentYear,
        },
      })

      if (alreadyExists) {
        continue
      }

      // Calculate allowances
      const da = basicSalary * (payParam.da / 100)
      const ta = basicSalary * (payParam.ta / 100)
      const hra = basicSalary * (payParam.hra / 100)
      const spall = basicSalary * (payParam.spall / 100)

      const medicalAll =
        payParam.medicalAllFixed > 0 ? payParam.medicalAllFixed : basicSalary * (payParam.medicalAllRate / 100)

      const grossSalary = basicSalary + da + ta + hra + spall + medicalAll

      // Calculate deductions
      const epf = basicSalary <= payParam.epfSalaryLimit ? basicSalary * (payParam.epfRate / 100) : 0

      const esi = grossSalary <= payParam.esiSalaryLimit ? grossSalary * (payParam.esiRate / 100) : 0

      const tds = grossSalary * (payParam.tdsRate / 100)
      const professionalTax = grossSalary * (payParam.professionalTaxRate / 100)

      const totalDeductions = epf + esi + tds + professionalTax
      const netSalary = grossSalary - totalDeductions

      // Create paymaster record within transaction
      const newPay = await tx.payMaster.create({
        data: {
          employeeId: employee.id,
          companyId: companyId,
          month: currentMonth,
          year: currentYear,
          basicSalary: basicSalary,
          da: da,
          ta: ta,
          hra: hra,
          spall: spall,
          medicalAll: medicalAll,
          otherAll: 0,
          epf: epf,
          esi: esi,
          tds: tds,
          professionalTax: professionalTax,
          otherDeductions: 0,
          grossSalary: grossSalary,
          totalDeductions: totalDeductions,
          netSalary: netSalary,
        },
      })

      paymasterData.push(newPay)
    }

    return paymasterData
  })

  if (paymasters.length === 0) {
    throw new ApiError(400, "No paymasters were generated")
  }

  return res
    .status(201)
    .json(new ApiResponse(201, paymasters, `Generated ${paymasters.length} paymasters successfully`))
})



const getEmployeeSalary = asyncHandler(async (req, res) => {
  const employeeId = req.employee?.id

  if (!employeeId) {
    throw new ApiError(401, "Employee Id is required")
  }

  const salaries = await prisma.payMaster.findMany({
    where: { employeeId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  })

  return res.status(200).json(new ApiResponse(200, salaries, "Salaries fetched successfully"))
})

const getEmployeeSalaryByMonthAndYear = asyncHandler(async (req, res) => {
  const { month, year } = req.params
  const employeeId = req.employee?.id

  if (!month || !year) {
    throw new ApiError(400, "Month and year required")
  }

  if (!employeeId) {
    throw new ApiError(401, "Employee Id is required")
  }

  const salary = await prisma.payMaster.findFirst({
    where: {
      employeeId: employeeId,
      month: Number(month),
      year: Number(year),
    },
  })

  if (!salary) {
    throw new ApiError(404, `Salary for ${month}/${year} not found`)
  }

  return res.status(200).json(new ApiResponse(200, salary, `Salary for ${month}/${year} fetched successfully`))
})  


export {generateSalary,getEmployeeSalary,getEmployeeSalaryByMonthAndYear}
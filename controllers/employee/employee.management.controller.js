import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import prisma from "../../config/prismaClient.js"
import { uploadOnCloudinary } from "../../utils/cloudinary.js"
import { hasPermission } from "../../middlewares/auth.middleware.js"

const getAllEmployees = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId
  const currentUser = req.user
  const userType = req.userType

  const {
    department,
    designation,
    role,
    status,
    type,
    search,
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
    employeeCode,
    salaryMin,
    salaryMax,
    joinedAfter,
    joinedBefore,
  } = req.query

  const whereClause = { companyId: companyId }

  // Department-specific access for managers
  if (currentUser.role === "MANAGER" && userType === "employee") {
    whereClause.departmentId = currentUser.departmentId
  }

  if (department) {
    const depart = await prisma.department.findFirst({
      where: { name: department, companyId: companyId },
    })

    if (depart) whereClause.departmentId = depart.id
  }

  if (designation) {
    const design = await prisma.designation.findFirst({
      where: { name: designation, companyId: companyId },
    })

    if (design) whereClause.designationId = design.id
  }

  if (role) whereClause.role = role
  if (type) whereClause.type = type
  if (status !== undefined) whereClause.isActive = status === "true"
  if (employeeCode) whereClause.employeeCode = employeeCode

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { employeeCode: { contains: search, mode: "insensitive" } },
    ]
  }

  if (salaryMin || salaryMax) {
    whereClause.salary = {}
    if (salaryMin) whereClause.salary.gte = Number.parseFloat(salaryMin)
    if (salaryMax) whereClause.salary.lte = Number.parseFloat(salaryMax)
  }

  if (joinedAfter || joinedBefore) {
    whereClause.joinedAt = {}
    if (joinedAfter) whereClause.joinedAt.gte = new Date(joinedAfter)
    if (joinedBefore) whereClause.joinedAt.lte = new Date(joinedBefore)
  }

  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
  const take = Number.parseInt(limit)
  const orderBy = { [sortBy]: sortOrder }

  // Check if user can view salary information
  const canViewSalary = hasPermission(currentUser.role, userType, "payroll:read")

  const [employees, totalCount] = await Promise.all([
    prisma.employee.findMany({
      where: whereClause,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        mobileNo: true,
        salary: canViewSalary,
        gender: true,
        type: true,
        role: true,
        isActive: true,
        profilePic: true,
        joinedAt: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    }),
    prisma.employee.count({ where: whereClause }),
  ])

  const pagination = {
    currentPage: Number.parseInt(page),
    totalPages: Math.ceil(totalCount / take),
    totalCount,
    hasNext: skip + take < totalCount,
    hasPrev: Number.parseInt(page) > 1,
  }

  return res.status(200).json(new ApiResponse(200, { employees, pagination }, "Employees fetched successfully"))
})

const getEmployeeById = asyncHandler(async (req, res) => {
  const employeeId = req.params?.id
  const companyId = req.user?.companyId
  const currentUser = req.user
  const userType = req.userType

  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required")
  }

  // Self-access check for regular employees
  if (userType === "employee" && currentUser.id !== Number.parseInt(employeeId)) {
    const managerialRoles = ["HR", "MANAGER", "ACCOUNTANT", "SR_MANAGER"]
    if (!managerialRoles.includes(currentUser.role)) {
      throw new ApiError(403, "Can only access your own profile")
    }

    // Department-specific access for managers
    if (currentUser.role === "MANAGER") {
      const targetEmployee = await prisma.employee.findFirst({
        where: { id: Number.parseInt(employeeId), companyId },
        select: { departmentId: true },
      })

      if (targetEmployee?.departmentId !== currentUser.departmentId) {
        throw new ApiError(403, "Can only access employees in your department")
      }
    }
  }

  const canViewSalary = hasPermission(currentUser.role, userType, "payroll:read")

  const employee = await prisma.employee.findFirst({
    where: {
      id: Number.parseInt(employeeId),
      companyId,
    },
    select: {
      id: true,
      employeeCode: true,
      name: true,
      email: true,
      mobileNo: true,
      salary: canViewSalary,
      gender: true,
      dob: true,
      address1: true,
      address2: true,
      type: true,
      role: true,
      profilePic: true,
      accountNo: true,
      pfAccountNo: true,
      isActive: true,
      joinedAt: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      city: { select: { cityName: true } },
      state: { select: { stateName: true } },
      bankCode: { select: { code: true, name: true } },
    },
  })

  if (!employee) {
    throw new ApiError(404, "Employee not found")
  }

  return res.status(200).json(new ApiResponse(200, employee, "Employee details fetched successfully"))
})

const updateEmployee = asyncHandler(async (req, res) => {
  const employeeId = Number.parseInt(req.params?.id)
  const currentUser = req.user
  const userType = req.userType
  const updateData = req.body

  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required")
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      role: true,
      companyId: true,
      email: true,
      departmentId: true,
      salary: true,
    },
  })

  if (!existingEmployee) {
    throw new ApiError(404, "Employee not found")
  }

  // Self-access validation for regular employees
  if (userType === "employee" && currentUser.id !== employeeId) {
    const managerialRoles = ["HR", "MANAGER", "ACCOUNTANT", "SR_MANAGER"]

    if (!managerialRoles.includes(currentUser.role)) {
      throw new ApiError(403, "Can only update your own profile")
    }

    // Department-specific access for managers
    if (currentUser.role === "MANAGER" && existingEmployee.departmentId !== currentUser.departmentId) {
      throw new ApiError(403, "Can only update employees in your department")
    }
  }

  // Role change validation
  if (updateData.role && updateData.role !== existingEmployee.role) {
    if (!hasPermission(currentUser.role, userType, "employee:manage")) {
      throw new ApiError(403, "Insufficient permissions to change employee role")
    }

    if (currentUser.role === "HR" && updateData.role === "SR_MANAGER") {
      throw new ApiError(403, "HR cannot assign Senior Manager role")
    }
  }

  // Salary update validation
  if (updateData.salary && !hasPermission(currentUser.role, userType, "payroll:manage")) {
    throw new ApiError(403, "Insufficient permissions to update salary")
  }

  const allowedFields = [
    "name",
    "email",
    "mobileNo",
    "salary",
    "gender",
    "dob",
    "address1",
    "address2",
    "type",
    "role",
    "accountNo",
    "pfAccountNo",
    "isActive",
  ]

  const filteredUpdateData = {}

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      // Self-update restrictions for regular employees
      if (userType === "employee" && currentUser.id === employeeId) {
        const selfUpdateFields = ["name", "email", "mobileNo", "address1", "address2", "accountNo", "pfAccountNo"]
        if (selfUpdateFields.includes(field)) {
          filteredUpdateData[field] = updateData[field]
        }
      } else {
        filteredUpdateData[field] = updateData[field]
      }
    }
  })

  if (filteredUpdateData.salary) {
    filteredUpdateData.salary = Number.parseFloat(filteredUpdateData.salary)
    if (filteredUpdateData.salary <= 0) {
      throw new ApiError(400, "Salary must be greater than 0")
    }
  }

  if (filteredUpdateData.dob) {
    filteredUpdateData.dob = new Date(filteredUpdateData.dob)
  }

  if (filteredUpdateData.email && filteredUpdateData.email !== existingEmployee.email) {
    const emailExists = await prisma.employee.findFirst({
      where: {
        email: filteredUpdateData.email,
        id: { not: employeeId },
        companyId: currentUser.companyId,
      },
    })

    if (emailExists) {
      throw new ApiError(400, "Email is already in use by another employee")
    }
  }

  if (filteredUpdateData.mobileNo) {
    const mobileExists = await prisma.employee.findFirst({
      where: {
        mobileNo: filteredUpdateData.mobileNo,
        id: { not: employeeId },
        companyId: currentUser.companyId,
      },
    })

    if (mobileExists) {
      throw new ApiError(400, "Mobile number is already in use by another employee")
    }
  }

  if (Object.keys(filteredUpdateData).length === 0) {
    throw new ApiError(400, "No valid fields to update")
  }

  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: filteredUpdateData,
    include: {
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  })

  return res.status(200).json(new ApiResponse(200, updatedEmployee, "Employee updated successfully"))
})

const deleteEmployee = asyncHandler(async (req, res) => {
  const employeeId = Number.parseInt(req.params?.id)
  const currentUser = req.user
  const userType = req.userType

  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required")
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      role: true,
      companyId: true,
      name: true,
      departmentId: true,
    },
  })

  if (!existingEmployee) {
    throw new ApiError(404, "Employee not found")
  }

  // Permission check - only those with employee:manage can delete
  if (!hasPermission(currentUser.role, userType, "employee:manage")) {
    throw new ApiError(403, "Insufficient permissions to delete employee")
  }

  // HR cannot delete Senior Manager
  if (currentUser.role === "HR" && existingEmployee.role === "SR_MANAGER") {
    throw new ApiError(403, "HR cannot delete Senior Manager")
  }

  // Check for existing payroll records
  const payrollRecords = await prisma.payMaster.count({
    where: { employeeId },
  })

  if (payrollRecords > 0) {
    throw new ApiError(400, "Cannot delete employee with existing payroll records. Consider deactivating instead.")
  }

  await prisma.employee.delete({ where: { id: employeeId } })

  return res.status(200).json(new ApiResponse(200, {}, "Employee deleted successfully"))
})

const updateProfilePic = asyncHandler(async (req, res) => {
  const employeeId = Number.parseInt(req.params?.id)
  const currentUser = req.user
  const userType = req.userType

  if (!employeeId) {
    throw new ApiError(400, "Employee id is required")
  }

  // Self-access check for regular employees
  if (userType === "employee" && currentUser.id !== employeeId) {
    const managerialRoles = ["HR", "MANAGER", "ACCOUNTANT", "SR_MANAGER"]
    if (!managerialRoles.includes(currentUser.role)) {
      throw new ApiError(403, "Can only update your own profile picture")
    }
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      companyId: true,
    },
  })

  if (!existingEmployee) {
    throw new ApiError(404, "Employee not found")
  }

  if (currentUser.companyId !== existingEmployee.companyId) {
    throw new ApiError(403, "Cannot update employee from different company")
  }

  const profilePicPath = req.files?.profilePic?.[0].path
  if (!profilePicPath) {
    throw new ApiError(400, "Profile picture is required")
  }

  const profilePicUri = await uploadOnCloudinary(profilePicPath)
  if (!profilePicUri?.url) {
    throw new ApiError(400, "Failed to upload profile picture")
  }

  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      profilePic: profilePicUri.url,
    },
    select: {
      id: true,
      profilePic: true,
    },
  })

  return res.status(200).json(new ApiResponse(200, updatedEmployee, "Profile picture updated successfully"))
})
 

const getEmployeeStats = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId
  const currentUser = req.user
  const userType = req.userType

  // Permission check - only those with employee:read can view stats
  if (!hasPermission(currentUser.role, userType, "employee:read")) {
    throw new ApiError(403, "Insufficient permissions to view employee statistics")
  }

  const whereClause = { companyId }

  // Department-specific access for managers
  if (currentUser.role === "MANAGER" && userType === "employee") {
    whereClause.departmentId = currentUser.departmentId
  }

  const [totalEmployees, activeEmployees, roleStats, departmentStats, typeStats, genderStats] = await Promise.all([
    prisma.employee.count({ where: whereClause }),
    prisma.employee.count({ where: { ...whereClause, isActive: true } }),
    prisma.employee.groupBy({
      by: ["role"],
      where: whereClause,
      _count: { role: true },
    }),
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: whereClause,
      _count: { departmentId: true },
    }),
    prisma.employee.groupBy({
      by: ["type"],
      where: whereClause,
      _count: { type: true },
    }),
    prisma.employee.groupBy({
      by: ["gender"],
      where: whereClause,
      _count: { gender: true },
    }),
  ])

  // Get department names for department stats
  const departmentIds = departmentStats.map((stat) => stat.departmentId).filter(Boolean)
  const departments = await prisma.department.findMany({
    where: { id: { in: departmentIds } },
    select: { id: true, name: true },
  })

  const departmentStatsWithNames = departmentStats.map((stat) => ({
    departmentName: departments.find((dept) => dept.id === stat.departmentId)?.name || "Unassigned",
    count: stat._count.departmentId,
  }))

  // Get salary statistics if user has permission
  let salaryOverview = null
  if (hasPermission(currentUser.role, userType, "payroll:read")) {
    const salaryData = await prisma.employee.aggregate({
      where: { ...whereClause, isActive: true, salary: { not: null } },
      _sum: { salary: true },
      _avg: { salary: true },
      _count: { salary: true },
    })

    if (salaryData._count.salary > 0) {
      salaryOverview = {
        totalBudget: salaryData._sum.salary,
        averageSalary: Math.round(salaryData._avg.salary),
        employeesWithSalary: salaryData._count.salary,
      }
    }
  }

  const statistics = {
    overview: {
      total: totalEmployees,
      active: activeEmployees,
      inactive: totalEmployees - activeEmployees,
      activePercentage: totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(1) : "0.0",
      ...(salaryOverview && salaryOverview),
    },
    byRole: roleStats.map((stat) => ({
      role: stat.role,
      count: stat._count.role,
    })),
    byDepartment: departmentStatsWithNames,
    byType: typeStats.map((stat) => ({
      type: stat.type,
      count: stat._count.type,
    })),
    byGender: genderStats.map((stat) => ({
      gender: stat.gender || "Not Specified",
      count: stat._count.gender,
    })),
  }

  return res.status(200).json(new ApiResponse(200, statistics, "Employee statistics fetched successfully"))
})  

export { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, updateProfilePic,getEmployeeStats }

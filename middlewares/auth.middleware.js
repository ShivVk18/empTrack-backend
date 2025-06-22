import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import prisma from "../config/prismaClient.js"

const verifyToken = async (token) => {
  if (!token) {
    throw new ApiError(401, "Access token required")
  }

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token")
  }
}

const findUserById = async (userId, userType) => {
  if (userType === "employee") {
    return await prisma.employee.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        employeeCode: true,
        role: true,
        companyId: true,
        mobileNo: true,
        isActive: true,
        departmentId: true,
      },
    })
  } else if (userType === "admin") {
    return await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        mobile: true,
      },
    })
  }
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

  const decodedToken = await verifyToken(token)

  const user = await findUserById(decodedToken._id, decodedToken.userType)

  if (!user) {
    throw new ApiError(401, "User not found")
  }

  if (decodedToken.userType === "employee" && !user.isActive) {
    throw new ApiError(403, "Employee account is inactive")
  }

  req.user = user
  req.userType = decodedToken.userType
  next()
})


const ROLE_PERMISSIONS = {

  admin: ["*"], // Wildcard for full access

 
  HR: [
    "employee:manage", 
    "department:manage", 
    "designation:manage",
    "payroll:manage", 
    "payparameter:manage", 
    "analytics:read", 
  ],

  
  SR_MANAGER: [
    "employee:read",
    "employee:update",
    "department:manage",
    "designation:manage", 
    "payroll:read",
    "payroll:generate",
    "payparameter:read",
    "analytics:read",
  ],

  
  MANAGER: [
    "employee:read", 
    "employee:update", 
    "department:read",
    "designation:read",
    "payroll:read", 
    "payparameter:read",
  ],

 
  ACCOUNTANT: [
    "employee:read",
    "payroll:manage",
    "payparameter:manage", 
    "analytics:read",
  ],


  EMPLOYEE: [
    "profile:read",
    "profile:update",
    "payroll:read:own", 
  ],
}

const hasPermission = (userRole, userType, permission) => {

  if (userType === "admin") return true

  const rolePermissions = ROLE_PERMISSIONS[userRole] || []

  if (rolePermissions.includes("*")) return true

  if (rolePermissions.includes(permission)) return true


  const [resource, action] = permission.split(":")
  if (action && rolePermissions.includes(`${resource}:manage`)) return true

  return false
}


const requirePermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    const userRole = req.user?.role
    const userType = req.userType

    if (!userRole && userType !== "admin") {
      throw new ApiError(401, "User role not found")
    }

    
    if (permission === "payroll:read:own") {
      const targetEmployeeId = Number.parseInt(req.params?.employeeId || req.query?.employeeId)

      if (userType === "employee" && targetEmployeeId && targetEmployeeId !== req.user.id) {
        throw new ApiError(403, "Can only access your own payroll data")
      }
    }

    if (!hasPermission(userRole, userType, permission)) {
      throw new ApiError(403, `Access denied. Insufficient permissions for: ${permission}`)
    }

    next()
  })
}


const requireRole = (allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    const userRole = req.user?.role
    const userType = req.userType

    if (!userRole && userType !== "admin") {
      throw new ApiError(401, "User role not found")
    }

    // Admin bypasses role restrictions
    if (userType === "admin") {
      return next()
    }

    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(403, `Access denied. Required roles: ${allowedRoles.join(", ")}`)
    }

    next()
  })
}

const requireAdminAccess = asyncHandler(async (req, res, next) => {
  if (req.userType !== "admin") {
    throw new ApiError(403, "Company admin access required")
  }
  next()
})

const requireManagerialRole = requireRole(["HR", "SR_MANAGER", "MANAGER", "ACCOUNTANT"])

const requireSeniorRole = requireRole(["HR", "SR_MANAGER"])

const requireFinancialRole = requireRole(["HR", "ACCOUNTANT", "SR_MANAGER"])

// Company and self access middlewares
const ensureCompanyAccess = asyncHandler(async (req, res, next) => {
  const userCompanyId = req.user?.companyId

  if (!userCompanyId) {
    throw new ApiError(401, "User company not found")
  }

  next()
})

const ensureSelfOrManagerialAccess = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id
  const targetUserId = Number.parseInt(req.params?.id || req.params?.userId)
  const userType = req.userType
  const userRole = req.user?.role

  // Admin has full access
  if (userType === "admin") return next()

  // Managerial roles have broader access
  const managerialRoles = ["HR", "SR_MANAGER", "MANAGER", "ACCOUNTANT"]
  if (managerialRoles.includes(userRole)) {
    return next()
  }

  // Regular employees can only access their own data
  if (targetUserId && targetUserId !== userId) {
    throw new ApiError(403, "Can only access your own data")
  }

  next()
})

export {
  authenticate,
  requirePermission,
  requireRole,
  requireAdminAccess,
  requireManagerialRole,
  requireSeniorRole,
  requireFinancialRole,
  ensureCompanyAccess,
  ensureSelfOrManagerialAccess,
  hasPermission,
  ROLE_PERMISSIONS,
}
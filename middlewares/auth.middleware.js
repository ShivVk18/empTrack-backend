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
  try {
    if (userType === "employee") {
      const employee = await prisma.employee.findUnique({
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
          leftAt: true, 
        },
      })
      
   
      if (employee && employee.leftAt) {
        throw new ApiError(403, "Employee account is no longer active")
      }
      
      return employee
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
    
    return null
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(500, "Database error while fetching user")
  }
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

  const decodedToken = await verifyToken(token)
   
  if (!decodedToken._id || !decodedToken.userType) {
    throw new ApiError(401, "Invalid token structure")
  }


  const user = await findUserById(decodedToken._id, decodedToken.userType)

  if (!user) {
    throw new ApiError(401, "User not found")
  }

  if (decodedToken.userType === "employee" && !user.isActive) {
    throw new ApiError(403, "Employee account is inactive")
  }

  if (!user.companyId) {
    throw new ApiError(403, "User not associated with any company")
  } 
  
  
  req.user = user

  req.userType = decodedToken.userType

  


console.log(`Authenticated UserType: ${req.userType}, Role: ${req.role}`);
  next()
})


const ROLE_PERMISSIONS = {

  admin: ["*"],  


  HR: [
    "employee:read",
    "employee:manage",
    "employee:update:basic",
    "employee:update:salary",
    "department:manage",
    "designation:manage",
    "payroll:manage",
    "payparameter:manage",
    "analytics:read",

    "attendance:manage",
    "attendance:approve",
    "attendancePlan:manage",
    "attendancePlan:read",

    "leavePolicy:manage",
    "leavePolicy:read",
    "leaveApplication:approve",
    "leaveApplication:read",

    "complain:manage",
    "complain:read",

    "holiday:manage",
    "holiday:read",

    "notification:manage",
    "notification:read",
  ],


  SR_MANAGER: [
    "employee:read",
    "employee:update:basic",
    "department:manage",
    "designation:manage",
    "payroll:read",
    "payroll:generate",
    "payparameter:read",
    "analytics:read",

    "attendance:read",
    "attendance:approve",
    "attendancePlan:read",

    "leavePolicy:read",
    "leaveApplication:approve",
    "leaveApplication:read",

    "complain:read",
    "holiday:read",
    "notification:read",
  ],


  MANAGER: [
    "employee:read",
    
    "department:read",
    "designation:read",
    "payroll:read",
    "payparameter:read",

    "attendance:read",
    "attendancePlan:read",

    "leavePolicy:read",
    "leaveApplication:read",

    "complain:read",
    "holiday:read",
    "notification:read",
  ],


  ACCOUNTANT: [
    "employee:read",
    "employee:update:salary",

    "payroll:manage",
    "payparameter:manage",
    "analytics:read",
  ],


  EMPLOYEE: [
    "profile:read",
    "profile:update",
    "payroll:read:own",

    "attendance:read:own",
    "attendance:clockin",
    "attendance:clockout",

    "leaveApplication:apply",
    "leaveApplication:cancel",
    "leaveApplication:read:own",

    "complain:raise",
    "complain:read:own",

    "holiday:read",
    "notification:read",
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

  
  if (userType === "admin") return next()

  
  const managerialRoles = ["HR", "SR_MANAGER", "MANAGER", "ACCOUNTANT"]
  if (managerialRoles.includes(userRole)) {
    return next()
  }

  
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
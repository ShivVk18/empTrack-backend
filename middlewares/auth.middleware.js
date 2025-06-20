import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../config/prismaClient.js";

const verifyToken = async(token) => {
  if(!token) {
    throw new ApiError(401,"Access token required")
  }

  try {
    return jwt.verify(token,process.env.ACCESS_TOKEN_SECRET) 
  } catch (error) {
    throw new ApiError(401,"Invalid or expired access token")
  }
}



const findUserById = async(userId,userType) => {
   if(userType === "employee"){
     return await prisma.employee.findUnique({
      where:{id:userId},
      select:{
        id: true,
        name: true,
        email: true,
        employeeCode: true,
        role: true,
        companyId: true,
        mobileNo: true,
        isActive: true,
        departmentId: true,
      }
     })
   } else if(userType === "admin"){
      return await prisma.admin.findUnique({
        where:{id:userId},
        select:{
        id: true,
        name: true,
        email: true,
        companyId: true,
        mobile: true,
        }
      })
   }
}

const authenticate = asyncHandler(async(req,res,next)=>{
   const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "")

   const decodedToken = await verifyToken(token)

   const user = await findUserById(decodedToken._id,decodedToken.userType)

   if(!user){
     throw new ApiError(401,"User not found")
   }

   if(decodedToken.userType === 'employee' && !user.isActive){
     throw new ApiError(403,"Employee account is inactive")
   }
    
   req.user = user
   req.userType = decodedToken.userType
   next()
})  


const ROLE_PERMISSIONS = {
   // Company Admin - Full access
  admin: [
    // Employee permissions
    "employee:create",
    "employee:read",
    "employee:update",
    "employee:delete",
    "employee:role-change",
    "employee:bulk-update",

    // Department permissions
    "department:create",
    "department:read",
    "department:update",
    "department:delete",

    // Designation permissions
    "designation:create",
    "designation:read",
    "designation:update",
    "designation:delete",

    // Payroll permissions
    "payroll:create",
    "payroll:read",
    "payroll:update",
    "payroll:delete",
    "payroll:generate",
    "payroll:bulk-update",

    // Pay parameter permissions
    "payparameter:create",
    "payparameter:read",
    "payparameter:update",
    "payparameter:delete",

    // Company permissions
    "company:read",
    "company:update",
    "company:delete",
    "company:stats",

    // Profile permissions
    "profile:read",
    "profile:update",

    // Analytics permissions
    "analytics:read",
    "analytics:compliance",
  ],

  // HR Manager - Employee and payroll management
  HR: [
    "employee:create",
    "employee:read",
    "employee:update",
    "employee:delete",
    "employee:role-change",
    "employee:bulk-update",

    "department:read",
    "department:create",
    "department:update",

    "designation:read",
    "designation:create",
    "designation:update",

    "payroll:create",
    "payroll:read",
    "payroll:update",
    "payroll:generate",
    "payroll:bulk-update",

    "payparameter:create",
    "payparameter:read",
    "payparameter:update",

    "profile:read",
    "profile:update",

    "analytics:read",
    "analytics:compliance",
  ],

  // Senior Manager - High-level operations
  SR_MANAGER: [
    "employee:read",
    "employee:update",
    "employee:role-change",

    "department:read",
    "department:create",
    "department:update",
    "department:delete",

    "designation:read",
    "designation:create",
    "designation:update",
    "designation:delete",

    "payroll:read",
    "payroll:update",
    "payroll:generate",

    "payparameter:read",
    "payparameter:update",

    "company:read",
    "company:stats",

    "profile:read",
    "profile:update",

    "analytics:read",
  ],

  // Manager - Team management
  MANAGER: [
    "employee:read",
    "employee:update",

    "department:read",

    "designation:read",

    "payroll:read",
    "payroll:update",

    "payparameter:read",

    "profile:read",
    "profile:update",

    "analytics:read",
  ],

  // Accountant - Financial operations
  ACCOUNTANT: [
    "employee:read",

    "payroll:create",
    "payroll:read",
    "payroll:update",
    "payroll:delete",
    "payroll:generate",
    "payroll:bulk-update",

    "payparameter:create",
    "payparameter:read",
    "payparameter:update",
    "payparameter:delete",

    "profile:read",
    "profile:update",

    "analytics:read",
    "analytics:compliance",
  ],

  // Regular Employee - Self-service only
  EMPLOYEE: ["profile:read", "profile:update", "payroll:read:own"],

}


const hasPermission = (userRole,userType,permission) => {
  if(userType === 'admin') return true;

  const rolePermissions = ROLE_PERMISSIONS[userRole] || []


  if(rolePermissions.includes(permission)) {
     return true
  }

  const [resource, action] = permission.split(":")
  const wildCardPermission = `${resource}`

  return rolePermissions.includes (wildCardPermission)
}


//Permission based middleware 

const requirePermission = (permission) => {
  return asyncHandler(async(req,res,next)=> {
    const userRole = req.user?.role
    const userType = req.userType 

    if(!userRole) {
      throw new ApiError(401,"User role not found")
    }

    if(permission === "payroll:read:own"){
      const targetEmployeeId = Number.parseInt(req.params?.employeeId) 

      if(userType === 'employee' && targetEmployeeId && targetEmployeeId !== req.user.id) {
        throw new ApiError(403,"Can only access your own payroll data")
      }

      if(!hasPermission(userRole,userType,permission)) {
        throw new ApiError(403,`Access denied. Required permission: ${permission}`)
      }

      next()
    }
  })
}


const requireRole = (allowedRoles) => {
  return asyncHandler(async(req,res,next) => {
    const userRole = req.user?.role
    const userType = req.userType 

    if(!userRole){
       throw new ApiError(401,"User role not found")
    }

    if(userType === 'admin'){
      return next()
    }

    if(!allowedRoles.includes(userRole)){
         throw new ApiError(403, `Access denied. Required roles: ${allowedRoles.join(", ")}`)
    }

    next()
  })
}

const requireAdminRoles = requireRole(["HR","MANAGER","ACCOUNTANT","SR_MANAGER"])

const authenticateAdmin = asyncHandler (async(req,res,next) => (
   authenticate(req,res,() => {
      if(req.userType!== 'admin') {
        throw new ApiError(403 ,"Company admin access required")
      }
     next()

   })
 
))

const authenticateEmployee = asyncHandler(async (req, res, next) => {
  authenticate(req, res, () => {
    if (req.userType !== "employee") {
      throw new ApiError(403, "Employee access required")
    }
    next()
  })
})

const ensureCompanyAccess = asyncHandler(async(req,res,next) => {
   const userCompanyId = req.user?.companyId

   if(!userCompanyId) {
     throw new ApiError (401, "User comany not found")
   }

   next()
})

const ensureSelfAccess = asyncHandler(async(req,res,next) => {
  const userId = req.user?.id
  const targetUserId = Number.parseInt(req.params?.id || req.params?.userId)
   const userType = req.userType

   if(userType === 'admin') return next()

   const adminRoles = ["HR", "MANAGER", "SR_MANAGER", "ACCOUNTANT"]
  if (adminRoles.includes(req.user?.role)) {
    return next()
  }  

  if(targetUserId && targetUserId !== userId) {
      throw new ApiError(403, "Can only access your own data")
  }  


  next()
})  


export {
  authenticate,
  authenticateAdmin,
  authenticateEmployee,
  requireRole,
  requirePermission,
  requireAdminRoles,
  ensureCompanyAccess,
  ensureSelfAccess,
  hasPermission,
  ROLE_PERMISSIONS,
}


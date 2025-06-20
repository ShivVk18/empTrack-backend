const USER_ROLES = {
    ADMIN : "admin",
    HR : "HR",
    MANAGER : "MANAGER",
    SR_MANAGER : "SR_MANAGER",
    ACCOUNTANT:"ACCOUNTANT",
    EMPLOYEE : "EMPLOYEE"
}

const EMPLOYEE_TYPES = {
    PERMANENT:"PERMANENT",
    CONTRACT:"CONTRACT",
    TEMPORARY:"TEMPORARY",
    INTERN:"INTERN"
}

const EMPLOYEE_STATUS = {
    ACTIVE: true,
    INACTIVE : false
}

const GENDER_OPTIONS = {
    MALE:"MALE",
    FEMALE:"FEMALE",
    OTHER:"OTHER"
}

const PERMISSIONS = {
  EMPLOYEE: {
    READ: "employee:read",
    CREATE: "employee:create",
    UPDATE: "employee:update",
    DELETE: "employee:delete",
    ALL: "employee:all",
  },
  DEPARTMENT: {
    READ: "department:read",
    CREATE: "department:create",
    UPDATE: "department:update",
    DELETE: "department:delete",
    ALL: "department:all",
  },
  DESIGNATION: {
    READ: "designation:read",
    CREATE: "designation:create",
    UPDATE: "designation:update",
    DELETE: "designation:delete",
    ALL: "designation:all",
  },
  PAYROLL: {
    READ: "payroll:read",
    CREATE: "payroll:create",
    UPDATE: "payroll:update",
    DELETE: "payroll:delete",
    ALL: "payroll:all",
    READ_OWN: "payroll:read:own",
  },
  PAYPARAMETER: {
    READ: "payparameter:read",
    CREATE: "payparameter:create",
    UPDATE: "payparameter:update",
    DELETE: "payparameter:delete",
    ALL: "payparameter:all",
  },
  PROFILE: {
    READ: "profile:read",
    UPDATE: "profile:update",
  },
}  

const MESSAGES = {
  SUCCESS: {
    CREATED: "Created successfully",
    UPDATED: "Updated successfully",
    DELETED: "Deleted successfully",
    FETCHED: "Fetched successfully",
    LOGIN: "Logged in successfully",
    LOGOUT: "Logged out successfully",
    PASSWORD_CHANGED: "Password changed successfully",
  },
  ERROR: {
    NOT_FOUND: "Not found",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    INVALID_CREDENTIALS: "Invalid credentials",
    VALIDATION_ERROR: "Validation error",
    INTERNAL_ERROR: "Internal server error",
    DUPLICATE_ENTRY: "Duplicate entry",
    INVALID_INPUT: "Invalid input provided",
  },
}


const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} 

const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
} 


const BANK_CATEGORIES = {
  PUBLIC_SECTOR: "Public Sector Banks",
  PRIVATE_SECTOR: "Private Sector Banks",
  FOREIGN: "Foreign Banks",
  REGIONAL_RURAL: "Regional Rural Banks",
  COOPERATIVE: "Cooperative Banks",
  SMALL_FINANCE: "Small Finance Banks",
  PAYMENT: "Payment Banks",
}
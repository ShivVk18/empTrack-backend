import prisma from "../../config/prismaClient.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  generateTokens,
  hashPassword,
  validatePassword,
  updateRefreshToken,
  clearRefreshToken,
  getCookieOptions,
} from "../../utils/auth.utils.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { hasPermission } from "../../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../email/email.controller.js";
import { parsePhoneNumberFromString as parsePhoneNumber } from 'libphonenumber-js'



const adminSignUp = asyncHandler(async (req, res) => {
  const {
    adminName,
    email,
    password,
    countryCode,
    mobile,
    companyName,
    industry,
    address,
    countryName,
    stateName,
    cityName,
    
  } = req.body;

  const requiredFields = [
    adminName,
    email,
    password,
    mobile,
    companyName,
    industry,
    address,
    countryName,
    stateName,
    cityName,
    
  ];

  if (requiredFields.some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const mobileNumber =  parsePhoneNumber(mobile,countryCode)
  
   
  if (!mobileNumber || !mobileNumber.isValid()) {
    throw new ApiError(400, 'Invalid mobile number for given country');
  }

  const formattedMobileNumber = mobileNumber.number

  const [existingCompany, existingAdmin] = await Promise.all([
    prisma.company.findUnique({ where: { name: companyName } }),
    prisma.admin.findFirst({
      where: {
        OR: [{ email }, { mobileNo:formattedMobileNumber }],
      },
    }),
   
  ]); 

  if (existingCompany) {
    throw new ApiError(
      400,
      "Company name already exists. Choose another name."
    );
  }

  if (existingAdmin) {
    throw new ApiError(400, "Admin with this email or mobile already exists");
  }

  

  const hashedPassword = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        industry:industry,
        address:address,
        countryName:countryName,
        stateName:stateName,
        cityName:cityName,
      },
      select:{
        name:true,
        industry:true,
        stateName:true,
        countryName:true,
        cityName:true,
        id:true,
        address:true
      }
    });

    const admin = await tx.admin.create({
      data: {
        name: adminName,
        email: email,
        password: hashedPassword,
        countryCode:countryCode,
        mobileNo: formattedMobileNumber,
        companyId: company.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNo: true,
        companyId: true,
        createdAt: true,
      },
    });

    return { company, admin };
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, result, "Company and admin created successfully")
    );
});


const uniqueCompanyName = asyncHandler(async (req, res) => {
  const { companyName } = req.query;

  if (!companyName?.trim()) {
    throw new ApiError(400, "Company Name is required");
  }

  const existingCompany = await prisma.company.findUnique({
    where: {
      name: companyName,
    },
  });

  if (existingCompany) {
    throw new ApiError(409, "Company Name already exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "The company name is unique"));
});



const addEmployee = asyncHandler(async (req, res) => {
  console.log("👉 Add Employee API hit");

  const {
    employeeCode,
    employeeName,
    email,
    countryCode,
    mobileNo,
    salary,
    gender,
    dob,
    address1,
    address2,
    password,
    type,
    role,
    accountNo,
    pfAccountNo,
    countryName,
    stateName,
    cityName,
    bankCode,
    designationName,
    departmentName,
  } = req.body;

  console.log("📦 Received Body:", req.body);

  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const currentUserType = req.userType;

  console.log("🏢 Company ID:", companyId);
  console.log("👤 Current User:", currentUser);
  console.log("👤 Current User Type:", currentUserType);

  const requiredFields = [
    employeeCode,
    employeeName,
    email,
    mobileNo,
    salary,
    gender,
    dob,
    address1,
    password,
    type,
    accountNo,
    pfAccountNo,
    countryName,
    stateName,
    cityName,
    bankCode,
    designationName,
    departmentName,
  ];

  if (requiredFields.some((field) => !field?.toString().trim())) {
    console.log("⚠️ Required fields missing");
    throw new ApiError(400, "All required fields must be provided");
  }

  if (role && ["HR", "MANAGER", "ACCOUNTANT", "SR_MANAGER"].includes(role)) {
    if (
      currentUserType !== "admin" &&
      !hasPermission(currentUser.role, currentUserType, "employee:manage")
    ) {
      console.log("🚫 No permission to assign role:", role);
      throw new ApiError(
        403,
        "You don't have permission to assign this role. Please contact an Admin."
      );
    }

    if (currentUser.role === "HR" && role === "SR_MANAGER") {
      console.log("🚫 HR cannot assign SR_MANAGER role");
      throw new ApiError(403, "HR cannot assign Senior Manager role");
    }
  }

  if (password.length < 8) {
    console.log("🚫 Password too short");
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log("🚫 Invalid email format");
    throw new ApiError(400, "Invalid email format");
  }

  const mobileNumber = parsePhoneNumber(mobileNo, countryCode);
  console.log("📲 Parsed Mobile Number:", mobileNumber);

  if (!mobileNumber || !mobileNumber.isValid()) {
    console.log("🚫 Invalid mobile number");
    throw new ApiError(400, "Invalid mobile number for given country");
  }

  if (Number.parseFloat(salary) <= 0) {
    console.log("🚫 Salary must be greater than 0");
    throw new ApiError(400, "Salary must be greater than 0");
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: {
      OR: [{ email }, { employeeCode }, { mobileNo }],
      companyId,
    },
  });

  if (existingEmployee) {
    console.log("Employee already exists with provided details");
    throw new ApiError(
      400,
      "Employee with this email, mobile, or employee code already exists"
    );
  }

  console.log("Checking Profile Picture...");
  const profilePicPath = req.file?.path;
  console.log("Profile Pic Path:", profilePicPath);

  if (!profilePicPath) {
    throw new ApiError(400, "Profile picture is required");
  }


  const [department, designation] = await Promise.all([
    prisma.department.findFirst({
      where: { name: departmentName, companyId },
    }),
    prisma.designation.findFirst({
      where: { name: designationName, companyId },
    }),
  ]);

  

  if (!department) throw new ApiError(400, "Invalid department");
  if (!designation) throw new ApiError(400, "Invalid designation");

  
  const profilePicUri = await uploadOnCloudinary(profilePicPath);
  

  if (!profilePicUri?.url) {
    throw new ApiError(400, "Failed to upload profile picture");
  }

  const hashedPassword = await hashPassword(password);
  const formattedMobileNumber = mobileNumber.number;

  console.log("✅ Creating Employee in Database...");
  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      name: employeeName,
      email,
      countryCode: countryCode,
      mobileNo: formattedMobileNumber,
      salary: Number.parseFloat(salary),
      gender:gender,
      dob: new Date(dob),
      address1,
      address2,
      password: hashedPassword,
      type,
      role: role || "EMPLOYEE",
      profilePic: profilePicUri.url,
      accountNo,
      pfAccountNo,
      bankCode: bankCode,
      countryName: countryName,
      stateName: stateName,
      cityName: cityName,
      departmentId: department.id,
      designationId: designation.id,
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      employeeCode: true,
      name: true,
      email: true,
      mobileNo: true,
      salary: true,
      gender: true,
      type: true,
      role: true,
      profilePic: true,
      isActive: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      bankCode: true,
      countryName: true,
      stateName: true,
      cityName: true,
    },
  });

  console.log("📧 Sending Welcome Email...");
  const temporaryPassword = req.body.password;

  try {
    await sendWelcomeEmail(employee, temporaryPassword);
    console.log(`✅ Welcome email sent to ${employee.email}`);
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
  }

  console.log("🎉 Employee Created Successfully");
  return res
    .status(201)
    .json(new ApiResponse(201, employee, "Employee created successfully"));
});


const universalLogin = asyncHandler(async (req, res) => {
  const { email, password, userType } = req.body;

  if (!email || !password || !userType) {
    throw new ApiError(400, "Email, password, and user type are required");
  }

  if (!["admin", "employee"].includes(userType)) {
    throw new ApiError(400, "User type must be either 'admin' or 'employee'");
  }

  const isEmail = email.includes("@");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (isEmail && !emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  let user = null;

  if (userType === "admin") {
    user = await prisma.admin.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNo: true,
        password: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            address:true,
            stateName:true,
            cityName:true,
            countryName:true,
            isActive:true
          },
        },
      },
    });
  } else {
    user = await prisma.employee.findFirst({
      where: {
        email,
        isActive: true,
      },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        mobileNo: true,
        password: true,
        role: true,
        type: true,
        address1:true,
        address2:true,
        companyId: true,
        isActive: true,
        profilePic:true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        department: {
          select: { name: true },
        },
        designation: {
          select: { name: true },
        },
      },
    });
  }

  if (!user) {
    throw new ApiError(404, `${userType} not found with provided credentials`);
  }

  const isPasswordValid = await validatePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { password: _, ...userWithoutPassword } = user;

  // ✅ Directly generate and set tokens (without OTP)
  const { accessToken, refreshToken } = await generateTokens(user, userType);
  await updateRefreshToken(user.id, refreshToken, userType);

  const cookieOptions = getCookieOptions();

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: userWithoutPassword,
          userType,
          accessToken,
          refreshToken,
        },
        `${userType === "employee" ? "Employee" : "Admin"} logged in successfully`
      )
    );
});


// const universalLogin = asyncHandler(async (req, res) => {

  
//   const { email, password, userType } = req.body;
    

//   if (!email || !password || !userType) {
//     throw new ApiError(
//       400,
//       "Email, password, and user type are required"
//     );
//   }

//   if (!["admin", "employee"].includes(userType)) {
//     throw new ApiError(400, "User type must be either 'admin' or 'employee'");
//   }

//   const isEmail = email.includes("@");
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 

//   if (isEmail && !emailRegex.test(email)) {
//     throw new ApiError(400, "Invalid email format");
//   }
  
//   let user = null;
//   let foundUserType = null;

//   try {
//     if (userType === "admin") {
      
//       user = await prisma.admin.findFirst({
//         where: { email:email },
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           mobileNo: true,
//           password: true,
//           companyId: true,
//           company: {
//             select: {
//               id: true,
//               name: true,
//               industry: true,
//             },
//           },
//         },
//       });
//       foundUserType = "admin";
//     } else {
      
//       user = await prisma.employee.findFirst({
//         where: {
//           email:email,
//           isActive: true,
//         },
//         select: {
//           id: true,
//           employeeCode: true,
//           name: true,
//           email: true,
//           mobileNo: true,
//           password: true,
//           role: true,
//           type: true,
//           companyId: true,
//           isActive: true,
//           company: {
//             select: {
//               id: true,
//               name: true,
//               industry: true,
//             },
//           },
//           department: {
//             select: { name: true },
//           },
//           designation: {
//             select: { name: true },
//           },
//         },
//       });
//       foundUserType = "employee";
//     }

//     if (!user) {
//       throw new ApiError(
//         404,
//         `${userType} not found with provided credentials`
//       );
//     }

//     const isPasswordValid = await validatePassword(password, user.password);
//     if (!isPasswordValid) {
//       throw new ApiError(401, "Invalid password");
//     }

//     const { password: _, ...userWithoutPassword } = user;

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           user: userWithoutPassword,
//           userType: foundUserType,
//           requiresOTP: true,
//           message: "Credentials verified. Please verify OTP to complete login.",
//         },
//         "Credentials verified successfully"
//       )
//     );
//   } catch (error) {
//     console.error("Universal login error:", error);
//     throw new ApiError(500, "Login failed. Please try again.");
//   }
// });

const getProfile = asyncHandler(async (req, res) => {
  const userType = req.userType;
  const userId = req.user.id;

  if (userType === "admin") {
    const profile = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNo: true,
        companyId: true,
      },
    });
    if (!profile) throw new ApiError(404, "Admin not found");
    return res
      .status(200)
      .json(new ApiResponse(200, profile, "Profile fetched successfully"));
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      mobileNo: true,
      salary: true,
      role: true,
      companyId: true,
      profilePic:true,
    },
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  const canSeeSalary = hasPermission(req.user.role, userType, "payroll:read");
  if (!canSeeSalary) delete employee.salary;

  return res
    .status(200)
    .json(new ApiResponse(200, employee, "Profile fetched successfully"));
});

const logoutHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const userType = req.userType;

  await clearRefreshToken(userId, userType);

  const cookieOptions = getCookieOptions();

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const userType = req.userType;
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    throw new ApiError(400, "All fields are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  let user = null;

  if (userType === "employee") {
    user = await prisma.employee.findUnique({ where: { id: userId } });
  } else {
    user = await prisma.admin.findUnique({ where: { id: userId } });
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isOldPasswordValid = await validatePassword(oldPassword, user.password);
  if (!isOldPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const isSamePassword = await validatePassword(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(
      400,
      "New password must be different from current password"
    );
  }

  const newHashedPassword = await hashPassword(newPassword);

  if (userType === "employee") {
    await prisma.employee.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });
  } else {
    await prisma.admin.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const { userType } = decodedToken;

    let user = null;

    if (userType === "employee") {
      user = await prisma.employee.findUnique({
        where: { id: decodedToken._id },
        select: {
          id: true,
          refreshToken: true,
          isActive: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
        },
      });
    } else {
      user = await prisma.admin.findUnique({
        where: { id: decodedToken._id },
        select: {
          id: true,
          refreshToken: true,
          name: true,
          email: true,
          companyId: true,
        },
      });
    }

    if (!user || user.id !== decodedToken._id) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (userType === "employee" && !user.isActive) {
      throw new ApiError(403, "Employee account is inactive");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user,
      userType
    );
    await updateRefreshToken(user.id, newRefreshToken, userType);

    const cookieOptions = getCookieOptions();

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
            user,
            userType
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});


export {
  adminSignUp,
  addEmployee,
  changePassword,
  getProfile,
  logoutHandler,
  universalLogin,
  refreshAccessToken,
};

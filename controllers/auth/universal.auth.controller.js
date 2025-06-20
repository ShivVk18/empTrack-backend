import prisma from "../../config/prismaClient";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  generateTokens,
  hashPassword,
  validatePassword,
  updateRefreshToken,
  clearRefreshToken,
  getCookieOptions,
} from "../../utils/auth.utils";

import { uploadOnCloudinary } from "../../utils/cloudinary";

import jwt from "jsonwebtoken";

const adminSignUp = asyncHandler(async (req, res) => {
  const {
    adminName,
    email,
    password,
    mobile,
    companyName,
    industry,
    address,
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
    stateName,
    cityName,
  ];
  if (requiredFields.some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Passwrod must be at least 8 characters long");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile)) {
    throw new ApiError(400, "Mobile number must be 10 digits");
  }

  const [existingCompany, existingAdmin, locationData] = await Promise.all([
    prisma.company.findUnique({ where: { name: companyName } }),
    prisma.admin.findFirst({
      where: {
        OR: [{ email }, { mobile }],
      },
    }),
    prisma.state.findFirst({
      where: { stateName },
      include: { cities: { where: { cityName }, take: 1 } },
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

  if (!locationData || !locationData.cities[0]) {
    throw new ApiError(400, "Invalid state or city");
  }

  const hashedPassword = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const company = await prisma.company.create({
      data: {
        name: companyName,
        industry,
        address,
        stateId: locationData.id,
        cityId: locationData.cities[0].id,
      },
    });

    const admin = await prisma.admin.create({
      data: {
        name: adminName,
        email: email,
        password: hashedPassword,
        mobile: mobile,
        companyId: company.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
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

const addEmployee = asyncHandler(async (req, res) => {
  const {
    employeeCode,
    employeeName,
    email,
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
    bankCode,
    stateName,
    cityName,
    designationName,
    departmentName,
  } = req.body;

  const companyId = req.user?.companyId;
  const currentUser = req.user;
  const currentUserType = req.userType;

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
    bankCode,
    stateName,
    cityName,
    designationName,
    departmentName,
  ];

  if (requiredFields.some((field) => !field?.toString().trim())) {
    throw new ApiError(400, "All required fields must be provided");
  }

  if (role && ["HR", "MANAGER", "ACCOUNTANT", "SR_MANAGER"].includes(role)) {
    if (currentUserType !== "admin" && currentUser.role !== "HR") {
      throw new ApiError(
        403,
        "Only company admin or HR can assign administrative roles"
      );
    }

    if (currentUser.role === "HR" && role === "SR_MANAGER") {
      throw new ApiError(403, "HR cannot assign Senior Manager role");
    }
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobileNo)) {
    throw new ApiError(400, "Mobile number must be 10 digits");
  }

  if (Number.parseFloat(salary) <= 0) {
    throw new ApiError(400, "Salary must be greater than 0");
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: {
      OR: [{ email }, { employeeCode }, { mobileNo }],
      companyId,
    },
  });

  if (existingEmployee) {
    throw new ApiError(
      400,
      "Employee with this email, mobile, or employee code already exists"
    );
  }

  const profilePicPath = req.files?.profilePic?.[0]?.path;

  if (!profilePicPath) {
    throw new ApiError(400, "Profile picture is required");
  }

  const [locationData, department, designation, bankCodeData] =
    await Promise.all([
      prisma.state.findFirst({
        where: { stateName },
        include: { cities: { where: { cityName }, take: 1 } },
      }),
      prisma.department.findFirst({
        where: { name: departmentName, companyId },
      }),
      prisma.designation.findFirst({
        where: { name: designationName, companyId },
      }),
      prisma.bankCode.findUnique({ where: { code: bankCode } }),
    ]);

  if (!locationData || !locationData.cities[0]) {
    throw new ApiError(400, "Invalid state or city");
  }

  if (!department) throw new ApiError(400, "Invalid department");
  if (!designation) throw new ApiError(400, "Invalid designation");
  if (!bankCodeData) throw new ApiError(400, "Invalid bank code");

  const profilePicUri = await uploadOnCloudinary(profilePicPath);
  if (!profilePicUri?.url) {
    throw new ApiError(400, "Failed to upload profile picture");
  }

  const hashedPassword = await hashPassword(password);

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      name: employeeName,
      email,
      mobileNo,
      salary: Number.parseFloat(salary),
      gender,
      dob: new Date(dob),
      address1,
      address2,
      password: hashedPassword,
      type,
      role: role || "EMPLOYEE",
      profilePic: profilePicUri.url,
      accountNo,
      pfAccountNo,
      bankCodeId: bankCodeData.id,
      cityId: locationData.cities[0].id,
      stateId: locationData.id,
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
      state: { select: { stateName: true } },
      city: { select: { cityName: true } },
      bankCode: { select: { code: true, name: true } },
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, employee, "Employee created successfully"));
});

const universalLogin = asyncHandler(async (req, res) => {
  const { emailOrMobile, password, userType } = req.body;

  if (!emailOrMobile || !password || !userType) {
    throw new ApiError(
      400,
      "Email/Mobile, password, and user type are required"
    );
  }

  if (!["admin", "employee"].includes(userType)) {
    throw new ApiError(400, "User type must be either 'admin' or 'employee'");
  }

  const isEmail = emailOrMobile.includes("@");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/;

  if (isEmail && !emailRegex.test(emailOrMobile)) {
    throw new ApiError(400, "Invalid email format");
  }
  if (!isEmail && !mobileRegex.test(emailOrMobile)) {
    throw new ApiError(400, "Invalid mobile number format");
  }

  let user = null;
  let foundUserType = null;

  try {
    if (userType === "admin") {
      const searchField = isEmail ? "email" : "mobileNo";
      user = await prisma.admin.findFirst({
        where: { [searchField]: emailOrMobile },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          password: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
            },
          },
        },
      });
      foundUserType = "admin";
    } else {
      const searchField = isEmail ? "email" : "mobileNo";
      user = await prisma.employee.findFirst({
        where: {
          [searchField]: emailOrMobile,
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
          companyId: true,
          isActive: true,
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
      foundUserType = "employee";
    }

    if (!user) {
      throw new ApiError(
        404,
        `${userType} not found with provided credentials`
      );
    }

    const isPasswordValid = validatePassword(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = generateTokens(user, foundUserType);
    await updateRefreshToken(user.id, refreshToken, foundUserType);

    const { password: _, ...userWithoutPassword } = user;

    const cookieOptions = getCookieOptions();

    return res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            user: userWithoutPassword,
            userType: foundUserType,
            accessToken,
            refreshToken,
          },
          `${foundUserType === "employee" ? "Employee" : "Admin"} logged in successfully`
        )
      );
  } catch (error) {
    console.error("Universal login error:", error);
    throw new ApiError(500, "Login failed. Please try again.");
  }
});

const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.userType;

  let profile = null;

  if (userType === "admin") {
    profile = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        companyId: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            industry: true,
            address: true,
            state: { select: { stateName: true } },
            city: { select: { cityName: true } },
          },
        },
      },
    });
  } else {
    profile = await prisma.employee.findFirst({
      where: {
        id: userId,
        companyId: req.user.companyId,
      },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        mobileNo: true,
        salary: true,
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
        company: {
          select: {
            name: true,
            industry: true,
          },
        },
      },
    });
  }

  if (!profile) {
    throw new ApiError(404, `${userType} not found`);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, profile, `${userType} profile fetched successfully`)
    );
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

  if (!oldPassword || !newPassword || !confirmNewPassword)
    throw new ApiError(400, "All fields are required");

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long");
  }

  let user = null;

  if (userType === "employee") {
    user = await prisma.employee.findUnique({ where: { id: userId } });
  } else {
    user = await prisma.employee.findUnique({ where: { id: userId } });
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

  if (newPassword === confirmNewPassword) {
    throw new ApiError(400, "Confirm password should be matched");
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
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const userType = req.userType;
  const updateData = req.body;

  const restrictedFields = [
    "password",
    "companyId",
    "salary",
    "role",
    "employeeCode",
  ];
  restrictedFields.forEach((field) => delete updateData[field]);

  let updatedProfile = null;

  if (userType === "admin") {
    const allowedFields = ["name", "email", "mobile"];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      throw new ApiError(400, "No valid fields to update");
    }

    if (filteredData.email || filteredData.mobile) {
      const existingAdmin = await prisma.admin.findFirst({
        where: {
          OR: [
            ...(filteredData.email ? [{ email: filteredData.email }] : []),
            ...(filteredData.mobile ? [{ mobile: filteredData.mobile }] : []),
          ],
          id: { not: userId },
        },
      });

      if (existingAdmin) {
        throw new ApiError(400, "Email or mobile already in use");
      }
    }

    updatedProfile = await prisma.admin.update({
      where: { id: userId },
      data: filteredData,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        updatedAt: true,
      },
    });
  } else {
    const allowedFields = ["name", "email", "mobileNo", "address1", "address2"];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      throw new ApiError(400, "No valid fields to update");
    }

    // Validate email and mobile uniqueness
    if (filteredData.email || filteredData.mobileNo) {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(filteredData.email ? [{ email: filteredData.email }] : []),
            ...(filteredData.mobileNo
              ? [{ mobileNo: filteredData.mobileNo }]
              : []),
          ],
          id: { not: userId },
          companyId: req.user.companyId,
        },
      });

      if (existingEmployee) {
        throw new ApiError(400, "Email or mobile already in use");
      }
    }

    updatedProfile = await prisma.employee.update({
      where: { id: userId },
      data: filteredData,
      select: {
        id: true,
        name: true,
        email: true,
        mobileNo: true,
        address1: true,
        address2: true,
        updatedAt: true,
      },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProfile, "Profile updated successfully"));
});

export {
  adminSignUp,
  addEmployee,
  refreshAccessToken,
  changePassword,
  getProfile,
  logoutHandler,
  universalLogin,
  updateProfile,
};

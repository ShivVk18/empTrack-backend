import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addEmployee = asyncHandler(async (req, res) => {
  const {
    employeeCode,
    name,
    email,
    mobileNo,
    salary,
    gender,
    dob,
    address1,
    address2,
    password,
    type,
    accountNo,
    pfAccountNo,
    bankCode,
    stateName,
    cityName,
    designationName,
    departmentName,
  } = req.body;

  //fetch company id from admin token
  const companyId = req.user?.companyId;

  //field validation
  if (
    [
      employeeCode,
      name,
      email,
      mobileNo,
      salary,
      gender,
      dob,
      address1,
      address2,
      password,
      type,
      accountNo,
      pfAccountNo,
      bankCode,
      stateName,
      cityName,
      designationName,
      departmentName,
    ].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  const profilePicPath = req.files?.profilePic?.[0]?.path;
  if (!profilePicPath) {
    throw new ApiError(400, "Profile picture is required");
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { email },
  });

  if (existingEmployee) {
    throw new ApiError(400, "Employee with this email already exists");
  }

  const [state, bankcode] = await Promise.all([
    prisma.state.findUnique({
      where: { stateName },
      include: {
        cities: {
          where: { cityName },
          take: 1,
        },
      },
    }),
    prisma.bankCode.findUnique({
      where: { code: bankCode },
    }),
  ]);

  if (!state) {
    throw new ApiError(400, "Invalid state name");
  }

  const city = state.cities[0];
  if (!city) {
    throw new ApiError(400, "Invalid city name for the specified state");
  }

  const [department, designation] = await Promise.all([
    prisma.department.findUnique({
      where: {
        name: departmentName,
        companyId,
      },
    }),
    prisma.designation.findUnique({
      where: {
        name: designationName,
        companyId,
      },
    }),
  ]);

  // Validate department, designation, and bank code
  if (!department) {
    throw new ApiError(400, "Invalid department name");
  }

  if (!designation) {
    throw new ApiError(400, "Invalid designation name");
  }

  if (!bankcode) {
    throw new ApiError(400, "Invalid bank code");
  }

  //profile pic uri upload on cloudinary
  const profilePicUri = await uploadOnCloudinary(profilePicPath);
  if (!profilePicUri?.url) {
    throw new ApiError(400, "Failed to upload profile picture");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        name,
        email,
        mobileNo,
        salary: parseFloat(salary),
        gender,
        dob: new Date(dob),
        address1,
        address2,
        password: hashedPassword,
        type,
        profilePic: profilePicUri.url,
        accountNo,
        pfAccountNo,
        bankCodeId: bankcode.id,
        cityId: city.id,
        stateId: state.id,
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
        profilePic: true,
        accountNo: true,
        pfAccountNo: true,
        isActive: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
        state: { select: { stateName: true } },
        city: { select: { cityName: true } },
        bankCode: { select: { code: true, bankName: true } },
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, employee, "Employee added successfully"));
  } catch (error) {
    console.error("Employee creation failed:", error);

    if (error.code === "P2002") {
      throw new ApiError(400, "Duplicate entry found");
    } else if (error.code === "P2003") {
      throw new ApiError(400, "Invalid reference data");
    } else if (error.code === "P2025") {
      throw new ApiError(400, "Required record not found");
    } else {
      throw new ApiError(500, "Failed to add employee");
    }
  }
});

const employeeLogin = asyncHandler(async (req, res) => {});

const employeeLogout = asyncHandler(async (req, res) => {});

const employeeUpdateProfile = asyncHandler(async (req, res) => {});

const employeeUpdateProfilePic = asyncHandler(async (req, res) => {});

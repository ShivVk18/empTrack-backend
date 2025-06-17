import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import prisma from "../config/prismaClient.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllEmployees = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;

  try {
    const allEmployees = await prisma.employee.findMany({
      where: { companyId: companyId },
      orderBy: { name: "asc" },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, allEmployees, "All Employee fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Failed to fetch all employees");
  }
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const employeeId = req.params?.id;

  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required");
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!existingEmployee) {
    throw new ApiError(404, "Employee not found");
  }

  await prisma.employee.delete({
    where: { id: employeeId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Employee deleted successfully"));
});

const updateEmployeeDetails = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobileNo,
    salary,
    gender,
    dob,
    address1,
    address2,
    type,
    accountNo,
    pfAccountNo,
    bankCode,
    stateName,
    cityName,
    designationName,
    departmentName,
  } = req.body;

  const employeeId = req.params?.id;
  const companyId = req.user?.companyId;

  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required");
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!existingEmployee) {
    throw new ApiError(404, "Employee not found");
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
    prisma.department.findFirst({
      where: {
        name: departmentName,
        companyId,
      },
    }),
    prisma.designation.findFirst({
      where: {
        name: designationName,
        companyId,
      },
    }),
  ]);

  if (!department) {
    throw new ApiError(400, "Invalid department name");
  }

  if (!designation) {
    throw new ApiError(400, "Invalid designation name");
  }

  if (!bankcode) {
    throw new ApiError(400, "Invalid bank code");
  }

  try {
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        name,
        email,
        mobileNo,
        salary,
        gender,
        dob: new Date(dob),
        address1,
        address2,
        type,
        accountNo,
        pfAccountNo,
        bankCodeId: bankcode.id,
        stateId: state.id,
        cityId: city.id,
        departmentId: department.id,
        designationId: designation.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        salary: true,
        gender: true,
        type: true,
        departmentId: true,
        designationId: true,
        mobileNo: true,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedEmployee, "Employee updated successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Problem in updating employee");
  }
});

const updateEmployeeProfilePic = asyncHandler(async (req, res) => {
  const employeeId = req.params?.id;

  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required");
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!existingEmployee) {
    throw new ApiError(404, "Employee not found");
  }

  const profilePicPath = req.files?.profilePic?.[0]?.path;
  if (!profilePicPath) {
    throw new ApiError(400, "Profile picture is required");
  }

  const profilePicUri = await uploadOnCloudinary(profilePicPath);

  try {
    const updatedProfilePicEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        profilePic: profilePicUri?.url,
      },
      select: {
        profilePic: true,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedProfilePicEmployee,
          "Profile pic uploaded successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Problem in updating employee profile pic");
  }
});

const findEmployeeUsingEmployeeCode = asyncHandler(async (req, res) => {
  const { employeeCode } = req.query;

  if (!employeeCode) {
    throw new ApiError(400, "Employee code is required");
  }

  const companyId = req.user?.companyId;

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        employeeCode: employeeCode,
        companyId: companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        salary: true,
        gender: true,
        type: true,
        departmentId: true,
        designationId: true,
        mobileNo: true,
      },
    });

    if (!employee) {
      throw new ApiError(404, "Employee with this code not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          employee,
          "Employee with employee code found successfully"
        )
      );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to find employee by code");
  }
});


const findEmployeeUsingEmployeeName = asyncHandler(async (req, res) => {
  const employeeName = req.query.employeeName?.trim();

  if (!employeeName) {
    throw new ApiError(400, "Employee name is required");
  }

  const companyId = req.user?.companyId;

  try {
    const employee = await prisma.employee.findMany({
      where: {
        name: { contains: employeeName, mode: "insensitive" },
        companyId: companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        salary: true,
        gender: true,
        type: true,
        departmentId: true,
        designationId: true,
        mobileNo: true,
      },
    });

    if (employee.length === 0) {
      throw new ApiError(404, "No employee found with this name");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          employee,
          "Employee with employee name found successfully"
        )
      );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to find employee by name");
  }
});


const advEmpFilter = asyncHandler(async(req,res)=>{ 
  const { departmentName, designationName, status, type } = req.query;
  const companyId = req.user?.companyId;

  const filterConditions = [];

  if (departmentName) {
    const department = await prisma.department.findFirst({
      where: {
        name: departmentName,
        companyId: companyId,
      },
    });

    if (!department) {
      throw new ApiError(400, "Invalid department name");
    }

    filterConditions.push({ departmentId: department.id });
  }

  if (designationName) {
    const designation = await prisma.designation.findFirst({
      where: {
        name: designationName,
        companyId: companyId,
      },
    });

    if (!designation) {
      throw new ApiError(400, "Invalid designation name");
    }

    filterConditions.push({ designationId: designation.id });
  }

  if (status !== undefined) {
    if (status === "true" || status === "false") {
      filterConditions.push({ isActive: status === "true" });
    } else {
      throw new ApiError(400, "Invalid status value. Use true or false.");
    }
  }

  if (type) {
    filterConditions.push({ type });
  }

  if (filterConditions.length === 0) {
    throw new ApiError(400, "At least one filter (department, designation, status, type) is required");
  }

  try {
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        OR: filterConditions, 
      },
      select: {
        id: true,
        employeeCode:true,
        email: true,
        name: true,
        companyId: true,
        salary: true,
        gender: true,
        type: true,
        departmentId: true,
        designationId: true,
        mobileNo: true,
      },
    });

    if (employees.length === 0) {
      throw new ApiError(404, "No employees found matching the filters");
    }

    return res.status(200).json(
      new ApiResponse(200, employees, "Employees fetched successfully with filters")
    );
  } catch (error) {
    throw new ApiError(500, "Failed to filter employees");
  }
});  


const viewProfile = asyncHandler(async(req,res)=>{
  const companyId = req.employee?.companyId
  const employeeId = req.employee?.id
  
  const employeeProfile = await prisma.employee.findFirst({
    where:{
      id:employeeId,
      companyId:companyId
    },
    select:{
      id: true,
      employeeCode:true,
      email: true,
      name: true,
      companyId: true,
      salary: true,
      gender: true,
      type: true,
      departmentId: true,
      designationId: true,
      mobileNo: true,
    }
  })

  
  if (!employeeProfile) {
    throw new ApiError(404, "Employee profile not found");
  }

  return res.status(200).json(
    new ApiResponse(200, employeeProfile, "Employee profile fetched successfully")
  );
})

export {getAllEmployees,deleteEmployee,updateEmployeeDetails,updateEmployeeProfilePic,findEmployeeUsingEmployeeCode,findEmployeeUsingEmployeeName,advEmpFilter,viewProfile}
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import prisma from "../config/prismaClient.js"; 
import bcrypt from "bcrypt";

const updateAdminPassword = asyncHandler(async(req,res)=>{
   const { currentPassword, newPassword } = req.body;

  const adminId = req.user?.id;
    if (!adminId) {
        throw new ApiError(401, "Unauthorized: Admin ID is required");
    }

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new passwords are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  const user = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isPasswordMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    throw new ApiError(
      400,
      "New password must be different from the current password"
    );
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  try {
    await prisma.user.update({
      where: { id: adminId },
      data: { password: hashedNewPassword },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password updated successfully"));
  } catch (error) {
    console.error("Error updating password:", error);
    throw new ApiError(500, "Failed to update password");
  }


})

const deleteCompany = asyncHandler(async (req,res) => {
     const companyId = req.user?.companyId;

     if (!companyId) {
        throw new ApiError(401, "Unauthorized: Company ID is required");
     }

     const company = await prisma.company.findUnique({
        where:{id:companyId}
     })

        if (!company) {
            throw new ApiError(404, "Company not found");
        }

    try {
        await prisma.company.delete({ where: { id: companyId } });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Company deleted successfully")); 


    } catch (error) {
        console.error("Error deleting company:", error);
        throw new ApiError(500, "Failed to delete company");
    }
}) 

const updateCompanyDetails = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    throw new ApiError(401, "Unauthorized: Company ID is required");
  }

  const { name, industry, address, stateName, cityName } = req.body;

  if (!name || !industry || !address || !stateName || !cityName) {
    throw new ApiError(400, "All fields are required");
  }

  const state = await prisma.state.findFirst({
    where: { stateName },
    include: {
      cities: {
        where: { cityName },
        take: 1,
      },
    },
  });

  if (!state) {
    throw new ApiError(400, "Invalid state");
  }

  const city = state.cities[0];

  if (!city) {
    throw new ApiError(400, "Invalid city");
  }

  try {
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        industry,
        address,
        stateId: state.id,
        cityId: city.id,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedCompany, "Company details updated successfully")
      );
  } catch (error) {
    console.error("Error updating company details:", error);
    throw new ApiError(500, "Failed to update company details");
  }
});

const updateAdminProfile = asyncHandler(async (req, res) => {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new ApiError(401, "Unauthorized: Admin ID is required");
  }

  const { name, email, mobile } = req.body;

  if (!name || !email || !mobile) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && existingUser.id !== adminId) {
    throw new ApiError(400, "Email is already in use by another user");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: adminId },
      data: { name, email, mobile },
    });

    return res.status(200).json(
      new ApiResponse(200, updatedUser, "Admin profile updated successfully")
    );
  } catch (error) {
    console.error("Error updating admin profile:", error);
    throw new ApiError(500, "Failed to update admin profile");
  }
});


export {
    updateAdminPassword,
    deleteCompany,
    updateCompanyDetails,
    updateAdminProfile
}  
import bcrypt from 'bcrypt'
import { generateAccessToken ,generateRefreshToken } from './jwt.js'
import prisma from '../config/prismaClient.js'
import { ApiError } from './ApiError.js'

const generateTokens = async(user,userType = 'user') =>{
     try {
        const userWithType =  {
             ...user ,
             userType
        }

        const accessToken = generateAccessToken(userWithType)
        const refreshToken = generateRefreshToken(userWithType)

        return {accessToken,refreshToken}
     } catch (error) {
        throw new ApiError(500, "Token generation failed")
     }
}

const validatePassword = async (plainPassword,hashedPassword) =>{
     return await bcrypt.compare(plainPassword,hashedPassword)
}

const hashPassword = async (password ,rounds=10) =>{
    return await bcrypt.hash(password,rounds)
}


const updateRefreshToken = async (userId, refreshToken, userType) => {
  console.log('updateRefreshToken called with:', { userId, userType, refreshToken: !!refreshToken });
  
  try {
    if (userType === "employee") {
      console.log('Updating employee refresh token...');
      await prisma.employee.update({
        where: { id: userId },
        data: {
          refreshToken: refreshToken
        }
      });
    } else if (userType === "admin") { // Changed from "user" to "admin"
      console.log('Updating admin refresh token...');
      await prisma.admin.update({ // Changed from prisma.user to prisma.admin
        where: { id: userId },
        data: {
          refreshToken: refreshToken
        }
      });
    } else {
      throw new Error(`Invalid userType: ${userType}. Expected 'admin' or 'employee'.`);
    }
    console.log('Refresh token updated successfully');
  } catch (error) {
    console.error('Error updating refresh token:', error);
    throw error;
  }
};


const clearRefreshToken = async (userId ,userType) =>{  

    await updateRefreshToken(userId,null,userType)

}


const getCookieOptions =  () => (
    {
        httpOnly:true,
        secure: process.env.NODE_ENV === 'production',
        sameSite:'strict',
        maxAge:7*24*60*60*1000 
    }
)


export{generateTokens,validatePassword,hashPassword,updateRefreshToken,clearRefreshToken,getCookieOptions}
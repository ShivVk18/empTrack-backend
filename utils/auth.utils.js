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

validatePassword = async (plainPassword,hashedPassword) =>{
     return await bcrypt.compare(plainPassword,hashedPassword)
}

const hashPassword = async (password ,rounds=10) =>{
    return await bcrypt.hash(password,rounds)
}

const updateRefreshToken = async(userId,refreshToken,userType) => {
     const table = userType === "employee" ? "employee" : "user"

     if(table === "employee"){
         await prisma.employee.update({
             where:{id:userId},
             data:{
                refreshToken:refreshToken
             }
         })
     }else{
         await prisma.user.update({
               where:{id:userId},
               data:{
                refreshToken:refreshToken
               }
         })
     }
}

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
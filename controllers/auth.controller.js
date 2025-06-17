import prisma from "../config/prismaClient";
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from  '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { generateAcessToken, generateRefreshToken } from "../utils/jwt.js";


const generateAccessAndRefreshToken =  async(userId) =>{
     try {
         
        const user = await prisma.user.findUnique({
             where:{id:userId}
        })

        if(!user){
            throw new ApiError(404,"User not found")
        }

        const accessToken = generateAcessToken(user)
        const refreshToken = generateRefreshToken(user)

        return {accessToken,refreshToken}
        
     } catch (error) {
         throw new ApiError(500, "Something went wrong while generating referesh and access token")
     }
}

const  adminSignUp = asyncHandler(async(req,res)=>{
     const {name,email,password,mobile,companyName,industry,address,stateName,cityName} = req.body
     
       
         if([ name,email,password,mobile,companyName,industry,address,stateName,cityName].some((field)=>field?.trim()==="")) {
          throw new ApiError(400, "All fields are required")
    } 


    const checkCompanyName = await prisma.company.findUnique({where:{name:companyName}})

    if(checkCompanyName) {
        throw new ApiError(400, "Company name already exists choose another name");
    }

    
    const [existingUser, state] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.state.findFirst({
      where: { stateName },
      include: {
        cities: {
          where: { cityName },
          take: 1
        }
      }
    })
  ]);

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  if (!state) {
    throw new ApiError(400, "Invalid state");
  }

  const city = state.cities[0];
  if (!city) {
    throw new ApiError(400, "Invalid city");
  }

  
  const hashPassword = await bcrypt.hash(password, 10);


  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
    
      const company = await tx.company.create({
        data: {
          name: companyName,
          industry,
          address,
          stateId: state.id,
          cityId: city.id
        }
      });

      //create admin 
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashPassword,
          mobile,
          role: "admin",
          companyId: company.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          companyId: true
        }
      });

      return { company, user };
    });
  } catch (error) {
    
    if (error.code === 'P2002') {
      
      throw new ApiError(400, "Duplicate entry found");
    } else if (error.code === 'P2003') {
      
      throw new ApiError(400, "Invalid reference data");
    } else {
      
      console.error('Transaction failed:', error);
      throw new ApiError(500, "Failed to create company and user");
    }
  }


  return res.status(201).json(
    new ApiResponse(201, result, "User registered successfully")
  );


})


const adminLogin = asyncHandler(async (req, res) => {
  const { email, mobile, password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  if (!email && !mobile) {
    throw new ApiError(400, "Email or mobile number is required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: email }, { mobile: mobile }],
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id
  );
  
  await prisma.user.update({where:{id:user.id} ,data:{refreshToken:refreshToken}})

  const loggedInUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      companyId: true,
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      }),
      "User logged in"
    );
});

const adminLogOut = asyncHandler(async(req,res)=>{
     await prisma.user.update({
       where:{
         id:req.user.id
       },
       data:{
         refreshToken:null
       }
     }); 

         const options = {
        httpOnly: true,
        secure: true
    }   
     return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"Admin logged out successfully"))
})  

const refreshAdminAccessToken = asyncHandler(async(req,res)=>{
   const incomingAdminRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

   if(!incomingAdminRefreshToken) {
     throw new ApiError(401, "unauthorized request")
   }  

    try {
       const decodedToken = jwt.verify(incomingAdminRefreshToken,process.env.REFRESH_TOKEN_SECRET) 

       const user = await prisma.user.findUnique({where:{id:decodedToken._id}}) 

       if(!user){
         throw new ApiError(401, "Invalid refresh token")
       }  

       if(incomingAdminRefreshToken !== user?.refreshToken){
             throw new ApiError(401, "Refresh token is expired or used")
       }  

        const options = {
           httpOnly:true,
           secure:true
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user.id)  
         
        await prisma.user.update({ 
          where:{id:user.id},data:{refreshToken:newRefreshToken}
        })
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
          new ApiResponse(200,{
             accessToken,refreshToken:newRefreshToken
          },"Access Token refreshed")
        )

    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})   




export {adminSignUp,adminLogin,adminLogOut,refreshAdminAccessToken}
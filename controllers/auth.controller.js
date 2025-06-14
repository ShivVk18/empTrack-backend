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
     
       

     const existingUser = await prisma.user.findUnique({where:{email}});
     if(existingUser){
        throw new ApiError(400,"User already exist")
     }

     const state = await prisma.state.findFirst({where:{stateName}})
     const city = await prisma.city.findFirst({
         where:{cityName,stateId:state?.id}
     })

     if(!state || !city ){
        throw new ApiError(400,"Invalid state or city")
     }
     
     //create the company 
     const company = await prisma.company.create({
        data:{
            name:companyName,
            industry,
            address,
            stateId:state?.id,
            cityId:city?.id
        }
     })
      
     //create the admin or user 
     
     //first hash the password 
     const hashPashword = await bcrypt.hash(password,10);

     const user = await prisma.user.create({
         data:{
             name,
             email,
             password:hashPashword,
             mobile,
             role:"admin",
             companyId:company.id
         }
     })

     //confirmation check on user 
     const confirmUser = await prisma.user.findUnique({
          where:{id:user.id},
          select:{
   id: true,
   name: true,
   email: true,
   mobile: true,
   role: true,
   companyId: true
          }

     })

     if(!confirmUser){
        throw new ApiError(500, "Something went wrong while registering the user")
     } 

     return res.status(201).json(
        new ApiResponse(200,{company,confirmUser},"User registered successfully")
     )


})


const adminLogin = asyncHandler(async(req,res)=>{ 
     const {email,mobile,password} = req.body;
      
     const user = await prisma.user.findFirst({
        where:{
            OR:[
                 {email:email},
                 {mobile:mobile}
            ]
     } })

     if(!user) {
        throw new ApiError(404,"User not found")
     }

     const isPasswordValid = await bcrypt.compare(password,user.password)

    if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    } 
     
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user.id);

    const loggedInUser = await prisma.user.findUnique({
         where:{
             id:user.id
         },
         select:{
            id: true,
   name: true,
   email: true,
   mobile: true,
   role: true,
   companyId: true
         }
    })
    
    const options = {
        httpOnly:true,
        secure:true
    }
    

    return res.cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{
            user: loggedInUser, accessToken,refreshToken
        }),
        "User logged in"
    )

         
} )



export {adminSignUp,adminLogin,generateAccessAndRefreshToken}
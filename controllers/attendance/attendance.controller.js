import prisma from "../../config/prismaClient";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import dayjs from "dayjs";


const clockIn = asyncHandler(async(req,res)=> {
    const userRole = req.user.role 
    const userId = req.user.id
    if(["HR","MANAGER","SR_MANAGER","ACCOUNTANT"].includes(userRole)){
        throw new ApiError(403,"Only employees can clock in")
    }

    const today = dayjs().startOf('day').toDate() 

    const existingAttedance = await prisma.attendance.findUnique({
        where:{
            employeeId:userId,
            date:today
        }
    })

    if(existingAttedance){
        throw new ApiError(400,"You have already clocked in today")
    }

    const employee = await prisma.employee.findUnique({
        where:{
            id:userId
        },
        include:{attendancePlan:true}
    })

    if(!employee.attendancePlan){
        throw new ApiError(400,"No attendance plan assigned")
    }

    const now  = new Date()
     
    const [shiftHour,shiftMinute] = employee.attendancePlan.shiftStartTime.split(":").map(Number)

    const shiftStartTime = dayjs(today).hour(shiftHour).minute(shiftMinute).second(0);
    const allowedLateMinutes = employee.attendancePlan.allowedLateMins || 0;

    const lateThreshold = shiftStartTime.add(allowedLateMinutes,"minute")

    let status = "PRESENT"

    if(dayjs(now).isAfter(lateThreshold)){
        status = "LATE"
    }

    await prisma.attendance.create({
        data:{
            employeeId:userId,
            date:today,
            inTime:now,
            status
        }
    });

    res.status(201).json(
        new ApiResponse(200,status,"Clock-in successful")
    )
})

const clockOut = asyncHandler(async(req,res)=> {
    const userRole = req.user.role 
    const userId = req.user.id
    if(["HR","MANAGER","SR_MANAGER","ACCOUNTANT"].includes(userRole)){
        throw new ApiError(403,"Only employees can clock out")
    }  
    
    const today = dayjs().startOf('date').toDate()

    const existingAttedance = await prisma.attendance.findUnique({
        where:{
            employeeId:userId,
            date:today
        }
    })

    if(!existingAttedance){
        throw new ApiError(400,"You have not clocked in yet")
    }
    
    if(existingAttedance.outTime){
        throw new ApiError(400,"You have already clocked out today")
    } 

    const employee = await prisma.employee.findUnique({
        where:{
            id:userId
        },
        include:{attendancePlan:true}
    })  
    
    if(!employee.attendancePlan){
        throw new ApiError(400,"No attendance plan assigned")
    }

    const now  = dayjs()
    const inTime = dayjs(existingAttedance.inTime)

    const totalWorkingHours = now.diff(inTime,"hour",true)
     
    let status = "PRESENT"

    if(totalWorkingHours < employee.attendancePlan.workingHours && !employee.attendancePlan.allowEarlyLeave){
            status = "EARLY_LEAVE"
    } 

    await prisma.attendance.update({
        where:{
            id:existingAttedance.id
        } ,
        data:{
            outTime:now,
            totalHours:totalWorkingHours.toFixed(2),
            status:status
        }
    })
    
    res.status(201).json(
        new ApiResponse(200,status,"Clock-out successful")
    )
})

import prisma from "../config/prismaClient.js"

export const getStates = async(req,res) => {
      try {
        const states = await prisma.state.findMany({
             select: {id:true,stateName:true}
        })
        
       return res.json(states)
      } catch (error) {
         console.log("Error fetching states:", error);
         return res.status(500).json({
             error:"Failed to fetch states"
         })
      }
}   




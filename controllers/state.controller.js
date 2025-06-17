import prisma from "../config/prismaClient.js"

export const getStates = async(req,res) => {
      try {
        const states = await prisma.state.findMany({
             select: {id:true,stateName:true}
        })
        
        res.json(states)
      } catch (error) {
         res.status(500).json({
             error:"Failed to fetch states"
         })
      }
}   




import prisma from "../config/prismaClient.js";

export const getCities = async(req,res) =>{
      try {
         const stateId = parseInt(req.params.stateId);
         const cities = await prisma.city.findMany({
             where:{stateId},
             select:{id:true,cityName:true}
         })

        return res.json(cities)
      } catch (error) {
        return res.status(500).json({error:"Failed to fetch cities"})
      }
}


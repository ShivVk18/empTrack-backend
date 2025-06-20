import prisma from "../config/prismaClient.js"
import { statesAndCities } from "../constants/citiesAndStates.js"
import { bankCodes } from "../constants/bankCodes.js"

async function seedStatesAndCities() {
  console.log("Seeding states and cities...")

  for (const stateData of statesAndCities) {
    const { stateName, cities } = stateData

    
    const existingState = await prisma.state.findUnique({
      where: { stateName },
    })

    if (existingState) {
      console.log(`State ${stateName} already exists, skipping...`)
      continue
    }

    const state = await prisma.state.create({
      data: {
        stateName,
        cities: {
          create: cities.map((cityName) => ({ cityName })),
        },
      },
    })

    console.log(`Seeded state: ${state.stateName} with ${cities.length} cities`)
  }
}

async function seedBankCodes() {
  console.log("Seeding bank codes...")

  for (const bank of bankCodes) {
   
    const existingBank = await prisma.bankCode.findUnique({
      where: { code: bank.code },
    })

    if (existingBank) {
      console.log(`Bank code ${bank.code} already exists, skipping...`)
      continue
    }

    await prisma.bankCode.create({
      data: bank,
    })

    console.log(`Seeded bank: ${bank.code} - ${bank.name}`)
  }
}

async function main() {
  try {
    console.log("Starting database seeding...")

   
    await seedStatesAndCities()

 
    await seedBankCodes()

    console.log("Database seeding completed successfully!")
    console.log(`Total states: ${statesAndCities.length}`)
    console.log(`Total bank codes: ${bankCodes.length}`)
  } catch (error) {
    console.error("Error seeding database:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

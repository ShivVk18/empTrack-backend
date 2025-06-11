import prisma from '../config/prismaClient.js';
import { statesAndCities } from '../constants/citiesAndStates.js';



async function main() {
  for (const stateData of statesAndCities) {
    const { stateName, cities } = stateData;

    const state = await prisma.state.create({
      data: {
        stateName,
        cities: {
          create: cities.map((cityName) => ({ cityName })),
        },
      },
    });

    console.log(`Seeded state: ${state.stateName}`);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

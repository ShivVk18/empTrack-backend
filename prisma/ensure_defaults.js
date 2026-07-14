import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  console.log(`Found ${companies.length} companies. Checking default configurations...`);

  for (const company of companies) {
    console.log(`Checking company: ${company.name} (ID: ${company.id})`);

    // 1. Check/Create default attendance plan
    const plan = await prisma.attendancePlan.findFirst({
      where: { companyId: company.id }
    });
    if (!plan) {
      await prisma.attendancePlan.create({
        data: {
          companyId: company.id,
          name: "Default Plan",
          description: "Standard 8-hour shift",
          workingHours: 8,
          allowedLateMins: 15,
          shiftStartTime: "09:00",
          isDefault: true,
        }
      });
      console.log(`- Created default attendance plan for ${company.name}`);
    }

    // 2. Check/Create default leave policies
    const policiesCount = await prisma.leavePolicy.count({
      where: { companyId: company.id }
    });
    if (policiesCount === 0) {
      await prisma.leavePolicy.createMany({
        data: [
          {
            companyId: company.id,
            leaveType: "Casual Leave",
            daysAllowed: 12,
            carryForward: false,
            isPaid: true,
          },
          {
            companyId: company.id,
            leaveType: "Sick Leave",
            daysAllowed: 10,
            carryForward: false,
            isPaid: true,
          },
          {
            companyId: company.id,
            leaveType: "Earned Leave",
            daysAllowed: 18,
            carryForward: true,
            maxCarryForwardDays: 6,
            isPaid: true,
          },
        ]
      });
      console.log(`- Created default leave policies for ${company.name}`);
    }

    // 3. Check/Create default pay parameters
    const paramsCount = await prisma.payParameter.count({
      where: { companyId: company.id }
    });
    if (paramsCount === 0) {
      await Promise.all(
        ["PERMANENT", "CONTRACT", "INTERN", "CONSULTANT", "PART_TIME"].map((type) =>
          prisma.payParameter.create({
            data: {
              companyId: company.id,
              employeeType: type,
              da: 10,
              ta: 5,
              hra: 20,
              spall: 15,
              medicalAllRate: 5,
              epfRate: 12,
              esiRate: 0.75,
              tdsRate: 2,
              professionalTaxRate: 1,
            }
          })
        )
      );
      console.log(`- Created default pay parameters for ${company.name}`);
    }
  }

  console.log("✅ All companies processed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

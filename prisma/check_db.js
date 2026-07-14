import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  console.log("Companies:", companies);

  const admins = await prisma.admin.findMany();
  console.log("Admins:", admins);

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      companyId: true,
    }
  });
  console.log("Employees:", employees);

  const leavePolicies = await prisma.leavePolicy.findMany();
  console.log("Leave Policies:", leavePolicies);

  const holidays = await prisma.holiday.findMany();
  console.log("Holidays:", holidays);
}

main().catch(console.error).finally(() => prisma.$disconnect());

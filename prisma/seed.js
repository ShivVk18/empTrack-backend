import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt'
const prisma = new PrismaClient();

async function main() {
  // 🧹 Clean old data
  await prisma.holiday.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.payParameter.deleteMany();
  await prisma.attendancePlan.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.department.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.company.deleteMany();

  // 🔑 Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const employeePassword = await bcrypt.hash("employee123", 10);

  // --- Create Company ---
  const company = await prisma.company.create({
    data: {
      name: "Seeker Technologies",
      industry: "TECHNOLOGY",
      address: "123 Startup Lane",
      countryName: "India",
      stateName: "Madhya Pradesh",
      cityName: "Gwalior",
    },
  });

  // --- Create Admin ---
  const admin = await prisma.admin.create({
    data: {
      name: "Shivansh Admin",
      email: "admin@seeker.com",
      password: adminPassword, // ✅ hashed
      countryCode: "+91",
      mobileNo: "9876543210",
      companyId: company.id,
    },
  });

  // --- Departments (5) ---
  const departments = await prisma.$transaction(
    ["Engineering", "HR", "Finance", "Marketing", "Operations"].map((name) =>
      prisma.department.create({
        data: {
          name,
          code: name.slice(0, 3).toUpperCase(),
          description: `${name} Department`,
          companyId: company.id,
        },
      })
    )
  );

  // --- Designations (5) ---
  const designations = await prisma.$transaction(
    [
      { name: "Software Engineer", dept: "Engineering" },
      { name: "HR Manager", dept: "HR" },
      { name: "Accountant", dept: "Finance" },
      { name: "Marketing Executive", dept: "Marketing" },
      { name: "Operations Lead", dept: "Operations" },
    ].map((d, idx) =>
      prisma.designation.create({
        data: {
          name: d.name,
          code: `DESG${idx + 1}`,
          description: `${d.name} designation`,
          level: "L1",
          companyId: company.id,
          departmentId: departments.find((dep) => dep.name === d.dept).id,
        },
      })
    )
  );

  // --- Attendance Plan ---
  const attendancePlan = await prisma.attendancePlan.create({
    data: {
      companyId: company.id,
      name: "Default Plan",
      description: "Standard 9-5 schedule",
      workingHours: 8,
      allowedLateMins: 15,
      shiftStartTime: "09:00",
      isDefault: true,
    },
  });

  // --- PayParameters for each EmployeeType ---
  const payParams = await prisma.$transaction(
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
        },
      })
    )
  );

  // --- Employees (10) ---
  const employees = await prisma.$transaction(
    Array.from({ length: 10 }).map((_, idx) =>
      prisma.employee.create({
        data: {
          employeeCode: `EMP${1000 + idx}`,
          name: `Employee ${idx + 1}`,
          email: `employee${idx + 1}@seeker.com`,
          countryCode: "+91",
          mobileNo: `90000000${10 + idx}`,
          password: employeePassword, // ✅ hashed
          salary: 30000 + idx * 1000,
          gender: idx % 2 === 0 ? "MALE" : "FEMALE",
          dob: new Date("1995-01-01"),
          address1: "123 Street",
          type: ["PERMANENT", "CONTRACT", "INTERN", "CONSULTANT", "PART_TIME"][idx % 5],
          role: "EMPLOYEE",
          accountNo: `ACC${10000 + idx}`,
          bankCode: "HDFC0001234",
          companyId: company.id,
          departmentId: departments[idx % 5].id,
          designationId: designations[idx % 5].id,
          countryName: "India",
          stateName: "Madhya Pradesh",
          cityName: "Gwalior",
          attendancePlanId: attendancePlan.id,
        },
      })
    )
  );

  // --- Holidays ---
  await prisma.$transaction([
    prisma.holiday.create({
      data: {
        companyId: company.id,
        date: new Date("2025-01-26"),
        name: "Republic Day",
      },
    }),
    prisma.holiday.create({
      data: {
        companyId: company.id,
        date: new Date("2025-08-15"),
        name: "Independence Day",
      },
    }),
  ]);

  console.log("✅ Seed data inserted successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

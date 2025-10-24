import { drizzle } from "drizzle-orm/mysql2";
import { employees, holidays, settings } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed settings (if not exists)
  try {
    await db.insert(settings).values({
      id: 1,
      leaveQuotaPerMonth: 2,
      tdsRate: 10,
      workingDaysPerMonth: 22,
    });
    console.log("✅ Settings created");
  } catch (error) {
    console.log("⚠️  Settings already exist");
  }

  // Seed employees
  const sampleEmployees = [
    {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@neuron.com",
      address: "123 MG Road, Bangalore, Karnataka",
      joiningDate: new Date("2023-01-15"),
      designation: "Senior Software Engineer",
      salary: 85000,
      status: "active" as const,
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@neuron.com",
      address: "456 Connaught Place, New Delhi",
      joiningDate: new Date("2023-03-20"),
      designation: "Product Manager",
      salary: 95000,
      status: "active" as const,
    },
    {
      name: "Amit Patel",
      email: "amit.patel@neuron.com",
      address: "789 Marine Drive, Mumbai, Maharashtra",
      joiningDate: new Date("2022-11-10"),
      designation: "UI/UX Designer",
      salary: 70000,
      status: "active" as const,
    },
    {
      name: "Sneha Reddy",
      email: "sneha.reddy@neuron.com",
      address: "321 Jubilee Hills, Hyderabad, Telangana",
      joiningDate: new Date("2023-05-01"),
      designation: "HR Manager",
      salary: 75000,
      status: "active" as const,
    },
    {
      name: "Vikram Singh",
      email: "vikram.singh@neuron.com",
      address: "654 Park Street, Kolkata, West Bengal",
      joiningDate: new Date("2022-08-15"),
      designation: "DevOps Engineer",
      salary: 80000,
      status: "active" as const,
    },
    {
      name: "Ananya Iyer",
      email: "ananya.iyer@neuron.com",
      address: "987 Anna Salai, Chennai, Tamil Nadu",
      joiningDate: new Date("2023-02-28"),
      designation: "Data Analyst",
      salary: 65000,
      status: "active" as const,
    },
  ];

  try {
    const insertedEmployees = await db.insert(employees).values(sampleEmployees);
    console.log(`✅ Created ${sampleEmployees.length} employees`);

    // Seed some leave records for the current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const leaveRecords = [
      { employeeId: 1, month: currentMonth, year: currentYear, leavesTaken: 1 },
      { employeeId: 2, month: currentMonth, year: currentYear, leavesTaken: 3 },
      { employeeId: 3, month: currentMonth, year: currentYear, leavesTaken: 0 },
      { employeeId: 4, month: currentMonth, year: currentYear, leavesTaken: 2 },
      { employeeId: 5, month: currentMonth, year: currentYear, leavesTaken: 4 },
      { employeeId: 6, month: currentMonth, year: currentYear, leavesTaken: 1 },
    ];

    await db.insert(holidays).values(leaveRecords);
    console.log(`✅ Created ${leaveRecords.length} leave records`);
  } catch (error: any) {
    if (error.message?.includes("Duplicate entry")) {
      console.log("⚠️  Sample data already exists");
    } else {
      console.error("❌ Error seeding data:", error);
    }
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});


import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./drizzle/schema";
import fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function exportData() {
  const authUsers = await db.select().from(schema.authUsers);
  const employees = await db.select().from(schema.employees);
  const holidays = await db.select().from(schema.holidays);
  const salaryHistory = await db.select().from(schema.salaryHistory);
  const payslips = await db.select().from(schema.payslips);
  const settings = await db.select().from(schema.settings);

  const data = {
    authUsers,
    employees,
    holidays,
    salaryHistory,
    payslips,
    settings
  };

  fs.writeFileSync("exported-data.json", JSON.stringify(data, null, 2));
  console.log("Data exported successfully!");
  console.log(`- Auth Users: ${authUsers.length}`);
  console.log(`- Employees: ${employees.length}`);
  console.log(`- Holidays: ${holidays.length}`);
  console.log(`- Salary History: ${salaryHistory.length}`);
  console.log(`- Payslips: ${payslips.length}`);
  console.log(`- Settings: ${settings.length}`);
}

exportData().catch(console.error);

import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import type { InsertUser, InsertEmployee, InsertHoliday, InsertPayslip, InsertSettings, InsertAuthUser } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(schema.users).values(values).onConflictDoUpdate({
      target: schema.users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Auth Users
export async function getAuthUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.authUsers).where(eq(schema.authUsers.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAuthUser(user: InsertAuthUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.authUsers).values(user).returning();
  return result[0];
}

export async function updateAuthUserLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(schema.authUsers).set({ lastLogin: new Date() }).where(eq(schema.authUsers.id, id));
}

export async function getAllAuthUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.authUsers);
}

export async function deleteAuthUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(schema.authUsers).where(eq(schema.authUsers.id, id));
}

// Employees
export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.employees);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.employees).where(eq(schema.employees.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEmployee(employee: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.employees).values(employee).returning();
  return result[0];
}

export async function updateEmployee(id: number, employee: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(schema.employees).set(employee).where(eq(schema.employees.id, id)).returning();
  return result[0];
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(schema.employees).where(eq(schema.employees.id, id));
}

// Holidays/Leaves
export async function getLeavesByMonth(month: number, year: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.holidays).where(
    and(eq(schema.holidays.month, month), eq(schema.holidays.year, year))
  );
}

export async function getLeaveByEmployeeAndMonth(employeeId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.holidays).where(
    and(
      eq(schema.holidays.employeeId, employeeId),
      eq(schema.holidays.month, month),
      eq(schema.holidays.year, year)
    )
  ).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertLeave(leave: InsertHoliday) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.holidays).values(leave).onConflictDoUpdate({
    target: [schema.holidays.employeeId, schema.holidays.month, schema.holidays.year],
    set: { leavesTaken: leave.leavesTaken, updatedAt: new Date() },
  }).returning();

  return result[0];
}

// Payslips
export async function getPayslipsByMonth(month: number, year: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.payslips).where(
    and(eq(schema.payslips.month, month), eq(schema.payslips.year, year))
  );
}

export async function getPayslipById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.payslips).where(eq(schema.payslips.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPayslip(payslip: InsertPayslip) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.payslips).values(payslip).returning();
  return result[0];
}

export async function getAllPayslips() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(schema.payslips);
}

// Settings
export async function getSettings() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.settings).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSettings(settings: Partial<InsertSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getSettings();
  if (existing) {
    const result = await db.update(schema.settings).set(settings).where(eq(schema.settings.id, existing.id)).returning();
    return result[0];
  } else {
    const result = await db.insert(schema.settings).values(settings as InsertSettings).returning();
    return result[0];
  }
}

// Dashboard stats
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0, monthlyPayroll: 0 };

  const employees = await getAllEmployees();
  const activeEmployees = employees.filter(e => e.status === 'active');
  const inactiveEmployees = employees.filter(e => e.status === 'inactive');
  const monthlyPayroll = activeEmployees.reduce((sum, e) => sum + e.salary, 0);

  return {
    totalEmployees: employees.length,
    activeEmployees: activeEmployees.length,
    inactiveEmployees: inactiveEmployees.length,
    monthlyPayroll,
  };
}

// Check if all employees have leave records for a given month
export async function checkAllEmployeesHaveLeaves(month: number, year: number) {
  const db = await getDb();
  if (!db) return { allRecorded: false, missingEmployees: [] };

  const employees = await getAllEmployees();
  const activeEmployees = employees.filter(e => e.status === 'active');
  const leaves = await getLeavesByMonth(month, year);
  
  const employeesWithLeaves = new Set(leaves.map(l => l.employeeId));
  const missingEmployees = activeEmployees.filter(e => !employeesWithLeaves.has(e.id));

  return {
    allRecorded: missingEmployees.length === 0,
    missingEmployees: missingEmployees.map(e => ({ id: e.id, name: e.name })),
  };
}

// Generate payslips for all employees for a given month
export async function generatePayslips(month: number, year: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const employees = await getAllEmployees();
  const activeEmployees = employees.filter(e => e.status === 'active');
  const settings = await getSettings();
  
  if (!settings) {
    throw new Error("Settings not configured");
  }

  const results = [];

  for (const employee of activeEmployees) {
    const leave = await getLeaveByEmployeeAndMonth(employee.id, month, year);
    const leavesTaken = leave?.leavesTaken || 0;
    const excessLeaves = Math.max(0, leavesTaken - settings.leaveQuotaPerMonth);
    const leaveDeduction = Math.floor((employee.salary / settings.workingDaysPerMonth) * excessLeaves);

    const grossSalary = employee.salary;
    const tds = Math.floor(grossSalary * (settings.tdsRate / 100));
    const netSalary = grossSalary - tds - leaveDeduction;

    const payslip = await createPayslip({
      employeeId: employee.id,
      month,
      year,
      grossSalary,
      tds,
      deductions: leaveDeduction,
      netSalary,
    });

    results.push(payslip);
  }

  return results;
}

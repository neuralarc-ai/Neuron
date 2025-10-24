import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  employees, 
  InsertEmployee,
  holidays,
  InsertHoliday,
  salaryHistory,
  InsertSalaryHistory,
  payslips,
  InsertPayslip,
  settings,
  InsertSettings
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== EMPLOYEE FUNCTIONS =====

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).orderBy(desc(employees.createdAt));
}

export async function getActiveEmployees() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).where(eq(employees.status, 'active')).orderBy(desc(employees.createdAt));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createEmployee(employee: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employees).values(employee);
  return result;
}

export async function updateEmployee(id: number, employee: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employees).set(employee).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(employees).where(eq(employees.id, id));
}

// ===== HOLIDAY/LEAVE FUNCTIONS =====

export async function getLeavesByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(holidays).where(eq(holidays.employeeId, employeeId)).orderBy(desc(holidays.year), desc(holidays.month));
}

export async function getLeavesByMonth(employeeId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(holidays).where(
    and(
      eq(holidays.employeeId, employeeId),
      eq(holidays.month, month),
      eq(holidays.year, year)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateLeave(leave: InsertHoliday) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getLeavesByMonth(leave.employeeId, leave.month, leave.year);
  
  if (existing) {
    await db.update(holidays).set({ leavesTaken: leave.leavesTaken }).where(eq(holidays.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(holidays).values(leave);
    return result;
  }
}

// ===== SALARY HISTORY FUNCTIONS =====

export async function getSalaryHistoryByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(salaryHistory).where(eq(salaryHistory.employeeId, employeeId)).orderBy(desc(salaryHistory.effectiveDate));
}

export async function createSalaryHistory(history: InsertSalaryHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(salaryHistory).values(history);
  return result;
}

// ===== PAYSLIP FUNCTIONS =====

export async function getAllPayslips() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payslips).orderBy(desc(payslips.year), desc(payslips.month));
}

export async function getPayslipsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payslips).where(eq(payslips.employeeId, employeeId)).orderBy(desc(payslips.year), desc(payslips.month));
}

export async function getPayslipByMonth(employeeId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payslips).where(
    and(
      eq(payslips.employeeId, employeeId),
      eq(payslips.month, month),
      eq(payslips.year, year)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPayslip(payslip: InsertPayslip) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payslips).values(payslip);
  return result;
}

// ===== SETTINGS FUNCTIONS =====

export async function getSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(settings).limit(1);
  if (result.length > 0) {
    return result[0];
  }
  
  // Create default settings if none exist
  const defaultSettings: InsertSettings = {
    leaveQuotaPerMonth: 2,
    tdsRate: 10,
    workingDaysPerMonth: 22
  };
  await db.insert(settings).values(defaultSettings);
  const newResult = await db.select().from(settings).limit(1);
  return newResult[0];
}

export async function updateSettings(settingsData: Partial<InsertSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const current = await getSettings();
  if (current) {
    await db.update(settings).set(settingsData).where(eq(settings.id, current.id));
  }
}



// ===== DASHBOARD FUNCTIONS =====

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0, monthlyPayroll: 0 };
  
  const allEmployees = await getAllEmployees();
  const activeEmps = allEmployees.filter(e => e.status === 'active');
  const monthlyPayroll = activeEmps.reduce((sum, emp) => sum + emp.salary, 0);
  
  return {
    totalEmployees: allEmployees.length,
    activeEmployees: activeEmps.length,
    inactiveEmployees: allEmployees.length - activeEmps.length,
    monthlyPayroll
  };
}

// ===== PAYSLIP GENERATION =====

export async function getPayslipById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payslips).where(eq(payslips.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function checkAllEmployeesHaveLeaves(month: number, year: number) {
  const db = await getDb();
  if (!db) return { allRecorded: false, missingEmployees: [] };
  
  const activeEmps = await getActiveEmployees();
  const missingEmployees: string[] = [];
  
  for (const emp of activeEmps) {
    const leave = await getLeavesByMonth(emp.id, month, year);
    if (!leave) {
      missingEmployees.push(emp.name);
    }
  }
  
  return {
    allRecorded: missingEmployees.length === 0,
    missingEmployees
  };
}

export async function generatePayslips(month: number, year: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const activeEmps = await getActiveEmployees();
  const settingsData = await getSettings();
  
  if (!settingsData) {
    throw new Error("Settings not configured");
  }
  
  const results: Array<{ employeeId: number; status: 'created' | 'already_exists' }> = [];
  
  for (const emp of activeEmps) {
    // Check if payslip already exists
    const existing = await getPayslipByMonth(emp.id, month, year);
    if (existing) {
      results.push({ employeeId: emp.id, status: 'already_exists' });
      continue;
    }
    
    // Get leave data
    const leave = await getLeavesByMonth(emp.id, month, year);
    const leavesTaken = leave?.leavesTaken || 0;
    
    // Calculate deductions
    const tds = Math.floor(emp.salary * (settingsData.tdsRate / 100));
    const excessLeaves = Math.max(0, leavesTaken - settingsData.leaveQuotaPerMonth);
    const leaveDeduction = Math.floor((emp.salary / settingsData.workingDaysPerMonth) * excessLeaves);
    
    const grossSalary = emp.salary;
    const totalDeductions = tds + leaveDeduction;
    const netSalary = grossSalary - totalDeductions;
    
    // Create payslip
    await createPayslip({
      employeeId: emp.id,
      month,
      year,
      grossSalary,
      tds,
      deductions: leaveDeduction,
      netSalary
    });
    
    results.push({ employeeId: emp.id, status: 'created' });
  }
  
  return { results };
}


import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
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

let _db: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] Attempting to connect to database...");
      const pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(pool);
      
      // Test the connection
      await pool.execute('SELECT 1');
      console.log("[Database] Successfully connected to database");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  } else if (!process.env.DATABASE_URL) {
    console.warn("[Database] DATABASE_URL environment variable not set");
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
  try {
    console.log('[Database] Getting all employees...');
    const db = await getDb();
    if (!db) {
      console.log('[Database] No database connection, returning mock data');
      // Return mock data when database is not available
      return [
        {
          id: 1,
          name: "Rajesh Kumar",
          email: "rajesh.kumar@neuron.com",
          address: "123 MG Road, Bangalore, Karnataka",
          joiningDate: new Date("2023-01-15"),
          designation: "Senior Software Engineer",
          agreementRefId: "REF001",
          salary: 85000,
          status: "active" as const,
          createdAt: new Date("2023-01-15"),
          updatedAt: new Date("2023-01-15")
        },
        {
          id: 2,
          name: "Priya Sharma",
          email: "priya.sharma@neuron.com",
          address: "456 Connaught Place, New Delhi",
          joiningDate: new Date("2023-03-20"),
          designation: "Product Manager",
          agreementRefId: "REF002",
          salary: 95000,
          status: "active" as const,
          createdAt: new Date("2023-03-20"),
          updatedAt: new Date("2023-03-20")
        },
        {
          id: 3,
          name: "Amit Patel",
          email: "amit.patel@neuron.com",
          address: "789 Marine Drive, Mumbai, Maharashtra",
          joiningDate: new Date("2022-11-10"),
          designation: "UI/UX Designer",
          agreementRefId: "REF003",
          salary: 70000,
          status: "active" as const,
          createdAt: new Date("2022-11-10"),
          updatedAt: new Date("2022-11-10")
        },
        {
          id: 4,
          name: "Sneha Reddy",
          email: "sneha.reddy@neuron.com",
          address: "321 Jubilee Hills, Hyderabad, Telangana",
          joiningDate: new Date("2023-05-01"),
          designation: "HR Manager",
          agreementRefId: "REF004",
          salary: 75000,
          status: "active" as const,
          createdAt: new Date("2023-05-01"),
          updatedAt: new Date("2023-05-01")
        },
        {
          id: 5,
          name: "Vikram Singh",
          email: "vikram.singh@neuron.com",
          address: "654 Park Street, Kolkata, West Bengal",
          joiningDate: new Date("2022-08-15"),
          designation: "DevOps Engineer",
          agreementRefId: "REF005",
          salary: 80000,
          status: "active" as const,
          createdAt: new Date("2022-08-15"),
          updatedAt: new Date("2022-08-15")
        },
        {
          id: 6,
          name: "Ananya Iyer",
          email: "ananya.iyer@neuron.com",
          address: "987 Anna Salai, Chennai, Tamil Nadu",
          joiningDate: new Date("2023-02-28"),
          designation: "Data Analyst",
          agreementRefId: "REF006",
          salary: 65000,
          status: "active" as const,
          createdAt: new Date("2023-02-28"),
          updatedAt: new Date("2023-02-28")
        }
      ];
    }
    
    console.log('[Database] Database connected, fetching real data');
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  } catch (error) {
    console.error('[Database] Error in getAllEmployees:', error);
    // Return mock data on error
    return [
      {
        id: 1,
        name: "Rajesh Kumar",
        email: "rajesh.kumar@neuron.com",
        address: "123 MG Road, Bangalore, Karnataka",
        joiningDate: new Date("2023-01-15"),
        designation: "Senior Software Engineer",
        agreementRefId: "REF001",
        salary: 85000,
        status: "active" as const,
        createdAt: new Date("2023-01-15"),
        updatedAt: new Date("2023-01-15")
      },
      {
        id: 2,
        name: "Priya Sharma",
        email: "priya.sharma@neuron.com",
        address: "456 Connaught Place, New Delhi",
        joiningDate: new Date("2023-03-20"),
        designation: "Product Manager",
        agreementRefId: "REF002",
        salary: 95000,
        status: "active" as const,
        createdAt: new Date("2023-03-20"),
        updatedAt: new Date("2023-03-20")
      }
    ];
  }
}

export async function getActiveEmployees() {
  const db = await getDb();
  if (!db) {
    // Return mock data when database is not available (same as getAllEmployees since all are active)
    return await getAllEmployees();
  }
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
  try {
    console.log('[Database] Getting dashboard stats...');
    const db = await getDb();
    if (!db) {
      console.log('[Database] No database connection, returning mock data');
      // Return mock data when database is not available
      return { 
        totalEmployees: 6, 
        activeEmployees: 6, 
        inactiveEmployees: 0, 
        monthlyPayroll: 480000 
      };
    }
    
    console.log('[Database] Database connected, fetching real data');
    const allEmployees = await getAllEmployees();
    const activeEmps = allEmployees.filter((e: any) => e.status === 'active');
    const monthlyPayroll = activeEmps.reduce((sum: number, emp: any) => sum + emp.salary, 0);
    
    return {
      totalEmployees: allEmployees.length,
      activeEmployees: activeEmps.length,
      inactiveEmployees: allEmployees.length - activeEmps.length,
      monthlyPayroll
    };
  } catch (error) {
    console.error('[Database] Error in getDashboardStats:', error);
    // Return mock data on error
    return { 
      totalEmployees: 6, 
      activeEmployees: 6, 
      inactiveEmployees: 0, 
      monthlyPayroll: 480000 
    };
  }
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


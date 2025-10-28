import { 
  serial, 
  text, 
  timestamp, 
  varchar, 
  integer, 
  pgEnum, 
  pgTable,
  boolean
} from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("status", ["active", "inactive"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Auth users table - simple username/password authentication
 */
export const authUsers = pgTable("auth_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // Store hashed password
  name: varchar("name", { length: 255 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastLogin: timestamp("lastLogin"),
});

export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = typeof authUsers.$inferInsert;

/**
 * Employees table - stores all employee information
 */
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  address: text("address"),
  joiningDate: timestamp("joiningDate").notNull(),
  designation: varchar("designation", { length: 255 }).notNull(),
  agreementRefId: varchar("agreementRefId", { length: 100 }),
  salary: integer("salary").notNull(), // Store as integer (in paise/cents)
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Holidays/Leave records table - tracks leave taken by employees
 */
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  leavesTaken: integer("leavesTaken").notNull().default(0),
  // New fields for detailed leave tracking
  leaveType: varchar("leaveType", { length: 20 }), // CL, SL, PL, HalfDay, LWP
  startDate: timestamp("startDate"), // When leave starts
  endDate: timestamp("endDate"), // When leave ends
  numberOfDays: varchar("numberOfDays", { length: 10 }), // e.g. "1" or "0.5" for half day
  reason: text("reason"), // Reason for leave
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = typeof holidays.$inferInsert;

/**
 * Leave balances table - tracks annual leave allocations and usage
 */
export const leaveBalances = pgTable("leaveBalances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  leaveType: varchar("leaveType", { length: 20 }).notNull(), // CL, SL, PL, LWP
  year: integer("year").notNull(),
  totalAllocated: integer("totalAllocated").notNull().default(0), // Annual allocation
  used: integer("used").notNull().default(0), // Days used
  balance: integer("balance").notNull().default(0), // Remaining balance
  carriedForward: integer("carriedForward").notNull().default(0), // From previous year
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type InsertLeaveBalance = typeof leaveBalances.$inferInsert;

/**
 * Salary history table - tracks salary changes over time
 */
export const salaryHistory = pgTable("salaryHistory", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  oldSalary: integer("oldSalary").notNull(), // Store as integer
  newSalary: integer("newSalary").notNull(), // Store as integer
  effectiveDate: timestamp("effectiveDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalaryHistory = typeof salaryHistory.$inferSelect;
export type InsertSalaryHistory = typeof salaryHistory.$inferInsert;

/**
 * Payslips table - stores generated payslips
 */
export const payslips = pgTable("payslips", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  grossSalary: integer("grossSalary").notNull(), // Store as integer
  tds: integer("tds").notNull(), // Store as integer
  deductions: integer("deductions").notNull(), // Store as integer (leave deductions)
  netSalary: integer("netSalary").notNull(), // Store as integer
  pdfUrl: text("pdfUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payslip = typeof payslips.$inferSelect;
export type InsertPayslip = typeof payslips.$inferInsert;

/**
 * Settings table - stores system configuration
 */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  leaveQuotaPerMonth: integer("leaveQuotaPerMonth").notNull().default(2),
  tdsRate: integer("tdsRate").notNull().default(10), // Store as percentage (10 = 10%)
  workingDaysPerMonth: integer("workingDaysPerMonth").notNull().default(22),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

/**
 * Company holidays table - manages national, regional, and optional holidays
 */
export const companyHolidays = pgTable("companyHolidays", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  date: timestamp("date").notNull(),
  type: varchar("type", { length: 20 }).default("National"), // National, Regional, Optional
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CompanyHoliday = typeof companyHolidays.$inferSelect;
export type InsertCompanyHoliday = typeof companyHolidays.$inferInsert;


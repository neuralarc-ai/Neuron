import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Auth users table - simple username/password authentication
 */
export const authUsers = mysqlTable("auth_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // Store hashed password
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLogin: timestamp("lastLogin"),
});

export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = typeof authUsers.$inferInsert;

/**
 * Employees table - stores all employee information
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  address: text("address"),
  joiningDate: timestamp("joiningDate").notNull(),
  designation: varchar("designation", { length: 255 }).notNull(),
  salary: int("salary").notNull(), // Store as integer (in paise/cents)
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Holidays/Leave records table - tracks leave taken by employees
 */
export const holidays = mysqlTable("holidays", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  leavesTaken: int("leavesTaken").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = typeof holidays.$inferInsert;

/**
 * Salary history table - tracks salary changes over time
 */
export const salaryHistory = mysqlTable("salaryHistory", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  oldSalary: int("oldSalary").notNull(), // Store as integer
  newSalary: int("newSalary").notNull(), // Store as integer
  effectiveDate: timestamp("effectiveDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalaryHistory = typeof salaryHistory.$inferSelect;
export type InsertSalaryHistory = typeof salaryHistory.$inferInsert;

/**
 * Payslips table - stores generated payslips
 */
export const payslips = mysqlTable("payslips", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  grossSalary: int("grossSalary").notNull(), // Store as integer
  tds: int("tds").notNull(), // Store as integer
  deductions: int("deductions").notNull(), // Store as integer (leave deductions)
  netSalary: int("netSalary").notNull(), // Store as integer
  pdfUrl: text("pdfUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payslip = typeof payslips.$inferSelect;
export type InsertPayslip = typeof payslips.$inferInsert;

/**
 * Settings table - stores system configuration
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  leaveQuotaPerMonth: int("leaveQuotaPerMonth").notNull().default(2),
  tdsRate: int("tdsRate").notNull().default(10), // Store as percentage (10 = 10%)
  workingDaysPerMonth: int("workingDaysPerMonth").notNull().default(22),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;


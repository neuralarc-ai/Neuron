import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow (kept for compatibility).
 */
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const employeeStatusEnum = pgEnum('employee_status', ['active', 'inactive']);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default('user').notNull(),
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
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // Store hashed password
  name: varchar("name", { length: 255 }),
  role: userRoleEnum("role").default('user').notNull(),
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
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  address: text("address"),
  joiningDate: timestamp("joiningDate").notNull(),
  designation: varchar("designation", { length: 255 }).notNull(),
  agreementRefId: varchar("agreementRefId", { length: 100 }),
  salary: integer("salary").notNull(), // Store as integer (in paise/cents)
  status: employeeStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Holidays/Leave records table - tracks leave taken by employees
 */
export const holidays = pgTable("holidays", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employeeId").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  leavesTaken: integer("leavesTaken").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = typeof holidays.$inferInsert;

/**
 * Salary history table - tracks salary changes over time
 */
export const salaryHistory = pgTable("salaryHistory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employeeId").notNull().references(() => employees.id, { onDelete: 'cascade' }),
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
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employeeId").notNull().references(() => employees.id, { onDelete: 'cascade' }),
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
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  leaveQuotaPerMonth: integer("leaveQuotaPerMonth").notNull().default(2),
  tdsRate: integer("tdsRate").notNull().default(10), // Store as percentage (10 = 10%)
  workingDaysPerMonth: integer("workingDaysPerMonth").notNull().default(22),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;


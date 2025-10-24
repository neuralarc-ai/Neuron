import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generatePayslipPDF } from "./payslipPdf";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      const session = (ctx.req as any).session;
      return session?.user || null;
    }),
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const authDb = await import("./authDb");
        const user = await authDb.getAuthUserByUsername(input.username);
        
        if (!user) {
          throw new Error("Invalid credentials");
        }
        
        const isValid = await authDb.verifyPassword(input.password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }
        
        // Update last login
        await authDb.updateLastLogin(user.id);
        
        // Set session
        const session = (ctx.req as any).session;
        session.user = user;
        
        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const session = (ctx.req as any).session;
      if (session) {
        session.destroy(() => {});
      }
      return { success: true };
    }),
  }),

  users: router({
    list: protectedProcedure.query(async () => {
      const authDb = await import("./authDb");
      const users = await authDb.getAllAuthUsers();
      return users.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      }));
    }),
    create: protectedProcedure
      .input(z.object({
        username: z.string().min(3),
        password: z.string().min(4),
        name: z.string().optional(),
        role: z.enum(["admin", "user"]).default("user"),
      }))
      .mutation(async ({ input }) => {
        const authDb = await import("./authDb");
        const existing = await authDb.getAuthUserByUsername(input.username);
        if (existing) {
          throw new Error("Username already exists");
        }
        const user = await authDb.createAuthUser(input);
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const session = (ctx.req as any).session;
        if (session?.user?.id === input.id) {
          throw new Error("Cannot delete your own account");
        }
        const authDb = await import("./authDb");
        await authDb.deleteAuthUser(input.id);
        return { success: true };
      }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async () => {
      const stats = await db.getDashboardStats();
      return stats;
    }),
  }),

  employees: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllEmployees();
    }),
    active: protectedProcedure.query(async () => {
      return await db.getActiveEmployees();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        address: z.string().optional(),
        joiningDate: z.date(),
        designation: z.string(),
        salary: z.number(),
        status: z.enum(["active", "inactive"]),
      }))
      .mutation(async ({ input }) => {
        await db.createEmployee(input);
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
        address: z.string().optional(),
        joiningDate: z.date(),
        designation: z.string(),
        salary: z.number(),
        status: z.enum(["active", "inactive"]),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEmployee(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmployee(input.id);
        return { success: true };
      }),
  }),

  leaves: router({
    createOrUpdate: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        month: z.number().min(1).max(12),
        year: z.number(),
        leavesTaken: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        await db.createOrUpdateLeave(input);
        return { success: true };
      }),
    getByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLeavesByEmployee(input.employeeId);
      }),
    checkAllRecorded: protectedProcedure
      .input(z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        const result = await db.checkAllEmployeesHaveLeaves(input.month, input.year);
        return result;
      }),
  }),

  payslips: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllPayslips();
    }),
    generate: protectedProcedure
      .input(z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }))
      .mutation(async ({ input }) => {
        const results = await db.generatePayslips(input.month, input.year);
        return results;
      }),
    downloadPdf: protectedProcedure
      .input(z.object({ payslipId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const payslip = await db.getPayslipById(input.payslipId);
        if (!payslip) {
          throw new Error("Payslip not found");
        }

        const employee = await db.getEmployeeById(payslip.employeeId);
        if (!employee) {
          throw new Error("Employee not found");
        }

        const settings = await db.getSettings();
        if (!settings) {
          throw new Error("Settings not configured");
        }

        const leave = await db.getLeavesByMonth(employee.id, payslip.month, payslip.year);
        const leavesTaken = leave?.leavesTaken || 0;
        const excessLeaves = Math.max(0, leavesTaken - settings.leaveQuotaPerMonth);

        // Calculate salary breakdown
        const basic = Math.floor(payslip.grossSalary * 0.5);
        const hra = Math.floor(payslip.grossSalary * 0.3);
        const otherAllowances = payslip.grossSalary - basic - hra;

        const monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"];

        const pdfBuffer = await generatePayslipPDF({
          employee: {
            name: employee.name,
            designation: employee.designation,
            employeeId: employee.id.toString(),
            agreementRefId: employee.agreementRefId || undefined,
          },
          period: {
            month: monthNames[payslip.month - 1],
            year: payslip.year,
          },
          salary: {
            basic,
            hra,
            otherAllowances,
            gross: payslip.grossSalary,
            tds: payslip.tds,
            leaveDeduction: payslip.deductions,
            netSalary: payslip.netSalary,
          },
          leaves: {
            taken: leavesTaken,
            quota: settings.leaveQuotaPerMonth,
            excess: excessLeaves,
          },
          settings: {
            workingDays: settings.workingDaysPerMonth,
            tdsRate: settings.tdsRate,
          },
        });

        // Convert buffer to base64 for transmission
        const base64Pdf = pdfBuffer.toString('base64');
        
        return {
          filename: `payslip_${employee.name.replace(/\s+/g, '_')}_${payslip.month}_${payslip.year}.pdf`,
          data: base64Pdf,
        };
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async () => {
      return await db.getSettings();
    }),
    update: protectedProcedure
      .input(z.object({
        leaveQuotaPerMonth: z.number(),
        tdsRate: z.number(),
        workingDaysPerMonth: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateSettings(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;


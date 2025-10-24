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
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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

        const pdfBuffer = generatePayslipPDF({
          employeeName: employee.name,
          employeeEmail: employee.email,
          designation: employee.designation,
          month: payslip.month,
          year: payslip.year,
          grossSalary: payslip.grossSalary,
          tds: payslip.tds,
          deductions: payslip.deductions,
          netSalary: payslip.netSalary,
          generatedDate: payslip.createdAt,
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


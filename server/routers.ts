
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generatePayslipPDF } from "./payslipPdf";

export const appRouter = router({
  system: systemRouter,

  dashboard: router({
    stats: publicProcedure.query(async () => {
      try {
        const stats = await db.getDashboardStats();
        return stats;
      } catch (error) {
        console.error("[Dashboard Stats Error]:", error);
        throw new Error("Failed to fetch dashboard statistics");
      }
    }),
  }),

  employees: router({
    list: publicProcedure.query(async () => {
      try {
        return await db.getAllEmployees();
      } catch (error) {
        console.error("[Employees List Error]:", error);
        throw new Error("Failed to fetch employees list");
      }
    }),
    active: publicProcedure.query(async () => {
      return await db.getActiveEmployees();
    }),
    create: publicProcedure
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
        try {
          console.log('[tRPC] Creating employee:', input.name);
          const result = await db.createEmployee(input);
          console.log('[tRPC] Employee creation result:', result);
          return { success: true, message: 'Employee created successfully' };
        } catch (error) {
          console.error('[tRPC] Employee creation error:', error);
          throw new Error('Failed to create employee');
        }
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
        address: z.string().optional(),
        joiningDate: z.date(),
        designation: z.string(),
        salary: z.number(),
        status: z.enum(["active", "inactive"]),
        // KYC fields
        aadhaarNumber: z.string().optional(),
        panNumber: z.string().optional(),
        phoneNumber: z.string().optional(),
        dateOfBirth: z.date().optional(),
        // Bank details
        bankAccountNumber: z.string().optional(),
        ifscCode: z.string().optional(),
        bankName: z.string().optional(),
        bankBranch: z.string().optional(),
        // Emergency contact
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
        emergencyContactRelation: z.string().optional(),
        // Nominee details
        nomineeName: z.string().optional(),
        nomineeRelation: z.string().optional(),
        nomineeAadhaar: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log('[tRPC] Updating employee:', input.id);
          const { id, ...data } = input;
          const result = await db.updateEmployee(id, data);
          console.log('[tRPC] Employee update result:', result);
          return { success: true, message: 'Employee updated successfully' };
        } catch (error) {
          console.error('[tRPC] Employee update error:', error);
          throw new Error('Failed to update employee');
        }
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          console.log('[tRPC] Deleting employee:', input.id);
          const result = await db.deleteEmployee(input.id);
          console.log('[tRPC] Employee deletion result:', result);
          return { success: true, message: 'Employee deleted successfully' };
        } catch (error) {
          console.error('[tRPC] Employee deletion error:', error);
          throw new Error('Failed to delete employee');
        }
      }),
  }),

  leaves: router({
    createOrUpdate: publicProcedure
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
    getByEmployee: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLeavesByEmployee(input.employeeId);
      }),
    checkAllRecorded: publicProcedure
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
    list: publicProcedure.query(async () => {
      return await db.getAllPayslips();
    }),
    generate: publicProcedure
      .input(z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }))
      .mutation(async ({ input }) => {
        const results = await db.generatePayslips(input.month, input.year);
        return results;
      }),
    downloadPdf: publicProcedure
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
    get: publicProcedure.query(async () => {
      return await db.getSettings();
    }),
    update: publicProcedure
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


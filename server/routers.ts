import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Helper function to calculate payroll
function calculatePayroll(
  grossSalary: number,
  tdsRate: number,
  leavesTaken: number,
  leaveQuota: number,
  workingDays: number
) {
  const tds = Math.floor((grossSalary * tdsRate) / 100);
  const excessLeaves = Math.max(0, leavesTaken - leaveQuota);
  const deductions = Math.floor((grossSalary / workingDays) * excessLeaves);
  const netSalary = grossSalary - tds - deductions;
  
  return { tds, deductions, netSalary };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // Simple hardcoded admin login
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(({ input }) => {
        if (input.username === 'admin' && input.password === 'admin') {
          return { success: true, role: 'admin' };
        }
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }),
  }),

  employees: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllEmployees();
    }),
    
    active: protectedProcedure.query(async () => {
      return await db.getActiveEmployees();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        address: z.string().optional(),
        joiningDate: z.date(),
        designation: z.string(),
        salary: z.number(),
        status: z.enum(['active', 'inactive']).default('active'),
      }))
      .mutation(async ({ input }) => {
        return await db.createEmployee(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        joiningDate: z.date().optional(),
        designation: z.string().optional(),
        salary: z.number().optional(),
        status: z.enum(['active', 'inactive']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // If salary is being updated, create salary history
        if (data.salary !== undefined) {
          const employee = await db.getEmployeeById(id);
          if (employee && employee.salary !== data.salary) {
            await db.createSalaryHistory({
              employeeId: id,
              oldSalary: employee.salary,
              newSalary: data.salary,
              effectiveDate: new Date(),
            });
          }
        }
        
        return await db.updateEmployee(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteEmployee(input.id);
      }),
  }),

  leaves: router({
    getByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLeavesByEmployee(input.employeeId);
      }),
    
    getByMonth: protectedProcedure
      .input(z.object({ 
        employeeId: z.number(),
        month: z.number().min(1).max(12),
        year: z.number()
      }))
      .query(async ({ input }) => {
        return await db.getLeavesByMonth(input.employeeId, input.month, input.year);
      }),
    
    createOrUpdate: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        month: z.number().min(1).max(12),
        year: z.number(),
        leavesTaken: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        return await db.createOrUpdateLeave(input);
      }),
  }),

  salaryHistory: router({
    getByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSalaryHistoryByEmployee(input.employeeId);
      }),
  }),

  payslips: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllPayslips();
    }),
    
    getByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPayslipsByEmployee(input.employeeId);
      }),
    
    getByMonth: protectedProcedure
      .input(z.object({ 
        employeeId: z.number(),
        month: z.number().min(1).max(12),
        year: z.number()
      }))
      .query(async ({ input }) => {
        return await db.getPayslipByMonth(input.employeeId, input.month, input.year);
      }),
    
    generate: protectedProcedure
      .input(z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { month, year } = input;
        const activeEmployees = await db.getActiveEmployees();
        const settingsData = await db.getSettings();
        
        if (!settingsData) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Settings not found' });
        }
        
        const results = [];
        
        for (const employee of activeEmployees) {
          // Check if payslip already exists
          const existing = await db.getPayslipByMonth(employee.id, month, year);
          if (existing) {
            results.push({ employeeId: employee.id, status: 'already_exists' });
            continue;
          }
          
          // Get leave data
          const leaveData = await db.getLeavesByMonth(employee.id, month, year);
          const leavesTaken = leaveData ? leaveData.leavesTaken : 0;
          
          // Calculate payroll
          const { tds, deductions, netSalary } = calculatePayroll(
            employee.salary,
            settingsData.tdsRate,
            leavesTaken,
            settingsData.leaveQuotaPerMonth,
            settingsData.workingDaysPerMonth
          );
          
          // Create payslip
          await db.createPayslip({
            employeeId: employee.id,
            month,
            year,
            grossSalary: employee.salary,
            tds,
            deductions,
            netSalary,
            pdfUrl: null,
          });
          
          results.push({ employeeId: employee.id, status: 'created' });
        }
        
        return { success: true, results };
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async () => {
      return await db.getSettings();
    }),
    
    update: protectedProcedure
      .input(z.object({
        leaveQuotaPerMonth: z.number().optional(),
        tdsRate: z.number().optional(),
        workingDaysPerMonth: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateSettings(input);
      }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async () => {
      const allEmployees = await db.getAllEmployees();
      const activeEmployees = allEmployees.filter(e => e.status === 'active');
      const inactiveEmployees = allEmployees.filter(e => e.status === 'inactive');
      
      // Calculate total payroll for active employees
      const settingsData = await db.getSettings();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      let totalPayroll = 0;
      
      if (settingsData) {
        for (const employee of activeEmployees) {
          const leaveData = await db.getLeavesByMonth(employee.id, currentMonth, currentYear);
          const leavesTaken = leaveData ? leaveData.leavesTaken : 0;
          
          const { netSalary } = calculatePayroll(
            employee.salary,
            settingsData.tdsRate,
            leavesTaken,
            settingsData.leaveQuotaPerMonth,
            settingsData.workingDaysPerMonth
          );
          
          totalPayroll += netSalary;
        }
      }
      
      return {
        totalEmployees: allEmployees.length,
        activeEmployees: activeEmployees.length,
        inactiveEmployees: inactiveEmployees.length,
        totalPayroll,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;


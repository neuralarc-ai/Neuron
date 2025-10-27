import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Employee {
  id: number
  name: string
  email: string
  address?: string
  joiningDate: string
  designation: string
  agreementRefId?: string
  salary: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Payslip {
  id: number
  employeeId: number
  month: number
  year: number
  grossSalary: number
  tds: number
  deductions: number
  netSalary: number
  pdfUrl?: string
  createdAt: string
}

export interface Holiday {
  id: number
  employeeId: number
  month: number
  year: number
  leavesTaken: number
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  monthlyPayroll: number
}

// Simple API functions
export const api = {
  // Get dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('salary, status')

      if (error) {
        console.error('Error fetching employees:', error)
        return {
          totalEmployees: 0,
          activeEmployees: 0,
          inactiveEmployees: 0,
          monthlyPayroll: 0
        }
      }

      const totalEmployees = employees.length
      const activeEmployees = employees.filter(emp => emp.status === 'active').length
      const inactiveEmployees = totalEmployees - activeEmployees
      const monthlyPayroll = employees.reduce((sum, emp) => sum + emp.salary, 0)

      return {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        monthlyPayroll
      }
    } catch (error) {
      console.error('Error in getDashboardStats:', error)
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        monthlyPayroll: 0
      }
    }
  },

  // Get all employees
  async getEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('createdAt', { ascending: false })

      if (error) {
        console.error('Error fetching employees:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getEmployees:', error)
      return []
    }
  },

  // Create employee
  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('employees')
        .insert([employee])

      if (error) {
        console.error('Error creating employee:', error)
        return { success: false, message: 'Failed to create employee' }
      }

      return { success: true, message: 'Employee created successfully' }
    } catch (error) {
      console.error('Error in createEmployee:', error)
      return { success: false, message: 'Failed to create employee' }
    }
  },

  // Update employee
  async updateEmployee(id: number, employee: Partial<Employee>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id)

      if (error) {
        console.error('Error updating employee:', error)
        return { success: false, message: 'Failed to update employee' }
      }

      return { success: true, message: 'Employee updated successfully' }
    } catch (error) {
      console.error('Error in updateEmployee:', error)
      return { success: false, message: 'Failed to update employee' }
    }
  },

  // Delete employee
  async deleteEmployee(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting employee:', error)
        return { success: false, message: 'Failed to delete employee' }
      }

      return { success: true, message: 'Employee deleted successfully' }
    } catch (error) {
      console.error('Error in deleteEmployee:', error)
      return { success: false, message: 'Failed to delete employee' }
    }
  },

  // Get all payslips
  async getPayslips(): Promise<Payslip[]> {
    try {
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) {
        console.error('Error fetching payslips:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPayslips:', error)
      return []
    }
  },

  // Create payslips
  async createPayslips(payslips: Omit<Payslip, 'id' | 'createdAt'>[]): Promise<{ success: boolean; message: string; data?: Payslip[] }> {
    try {
      const { data, error } = await supabase
        .from('payslips')
        .insert(payslips)
        .select()

      if (error) {
        console.error('Error creating payslips:', error)
        return { success: false, message: 'Failed to create payslips' }
      }

      return { success: true, message: `Created ${data.length} payslips successfully`, data }
    } catch (error) {
      console.error('Error in createPayslips:', error)
      return { success: false, message: 'Failed to create payslips' }
    }
  },

  // Delete payslip
  async deletePayslip(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('payslips')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting payslip:', error)
        return { success: false, message: 'Failed to delete payslip' }
      }

      return { success: true, message: 'Payslip deleted successfully' }
    } catch (error) {
      console.error('Error in deletePayslip:', error)
      return { success: false, message: 'Failed to delete payslip' }
    }
  },

  // Download payslip PDF (placeholder for now)
  async downloadPayslipPdf(payslipId: number): Promise<void> {
    // In a real implementation, you'd generate PDF and trigger download
    console.log(`Would download PDF for payslip ${payslipId}`)
  },

  // Get leaves by month
  async getLeavesByMonth(employeeId: number, month: number, year: number): Promise<Holiday | null> {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('employeeId', employeeId)
        .eq('month', month)
        .eq('year', year)
        .single()

      if (error) {
        console.error('Error fetching leaves:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getLeavesByMonth:', error)
      return null
    }
  },

  // Create or update leave
  async createOrUpdateLeave(leave: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string }> {
    try {
      // First check if leave record exists
      const existing = await this.getLeavesByMonth(leave.employeeId, leave.month, leave.year)

      if (existing) {
        const { error } = await supabase
          .from('holidays')
          .update({ leavesTaken: leave.leavesTaken })
          .eq('id', existing.id)

        if (error) {
          console.error('Error updating leave:', error)
          return { success: false, message: 'Failed to update leave' }
        }

        return { success: true, message: 'Leave updated successfully' }
      } else {
        const { error } = await supabase
          .from('holidays')
          .insert([leave])

        if (error) {
          console.error('Error creating leave:', error)
          return { success: false, message: 'Failed to create leave' }
        }

        return { success: true, message: 'Leave created successfully' }
      }
    } catch (error) {
      console.error('Error in createOrUpdateLeave:', error)
      return { success: false, message: 'Failed to save leave' }
    }
  },

  // Get settings
  async getSettings(): Promise<{ leaveQuotaPerMonth: number; tdsRate: number; workingDaysPerMonth: number } | null> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching settings:', error)
        return { leaveQuotaPerMonth: 2, tdsRate: 10, workingDaysPerMonth: 22 }
      }

      return data || { leaveQuotaPerMonth: 2, tdsRate: 10, workingDaysPerMonth: 22 }
    } catch (error) {
      console.error('Error in getSettings:', error)
      return { leaveQuotaPerMonth: 2, tdsRate: 10, workingDaysPerMonth: 22 }
    }
  }
}

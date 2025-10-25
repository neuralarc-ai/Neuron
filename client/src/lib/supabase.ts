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
  }
}

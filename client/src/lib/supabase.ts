import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Authentication helper functions
export const auth = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get user profile
  async getUserProfile() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .single()
    return { data, error }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const { user } = await supabase.auth.getUser()
    return !!user
  }
}

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
  
  // KYC fields
  aadhaarNumber?: string
  panNumber?: string
  phoneNumber?: string
  dateOfBirth?: string
  
  // Bank details
  bankAccountNumber?: string
  ifscCode?: string
  bankName?: string
  bankBranch?: string
  
  // Emergency contact
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  
  // Nominee details
  nomineeName?: string
  nomineeRelation?: string
  nomineeAadhaar?: string
  
  // Profile photo
  profilePhotoUrl?: string
  
  // KYC status
  kycStatus?: 'pending' | 'verified' | 'rejected'
  kycVerifiedAt?: string
  kycVerifiedBy?: number
  
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
  leaveType?: string
  startDate?: string
  endDate?: string
  numberOfDays?: string
  reason?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  monthlyPayroll: number
}

export interface KycDocument {
  id: number
  employeeId: number
  documentType: string
  documentName: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  uploadDate: string
  verified: boolean
  verifiedBy?: number
  verifiedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
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
      console.log('Creating employee with data:', employee);
      
      const { error } = await supabase
        .from('employees')
        .insert([employee]);

      if (error) {
        console.error('Error creating employee:', error);
        return { success: false, message: `Failed to create employee: ${error.message}` };
      }

      console.log('Employee created successfully');
      return { success: true, message: 'Employee created successfully' };
    } catch (error) {
      console.error('Error in createEmployee:', error);
      return { success: false, message: 'Failed to create employee' };
    }
  },

  // Update employee
  async updateEmployee(id: number, employee: Partial<Employee>): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Updating employee with ID:', id);
      console.log('Update data:', employee);
      
      const { error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id);

      if (error) {
        console.error('Error updating employee:', error);
        return { success: false, message: `Failed to update employee: ${error.message}` };
      }

      console.log('Employee updated successfully');
      return { success: true, message: 'Employee updated successfully' };
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      return { success: false, message: 'Failed to update employee' };
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
  async getSettings(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching settings:', error)
        return { leaveQuotaPerMonth: 2, tdsRate: 10, workingDaysPerMonth: 22, clAllocation: 12, slAllocation: 12, plAllocation: 15, lwpAllocation: 0 }
      }

      return data || { leaveQuotaPerMonth: 2, tdsRate: 10, workingDaysPerMonth: 22, clAllocation: 12, slAllocation: 12, plAllocation: 15, lwpAllocation: 0 }
    } catch (error) {
      console.error('Error in getSettings:', error)
      return { leaveQuotaPerMonth: 2, tdsRate: 10, workingDaysPerMonth: 22, clAllocation: 12, slAllocation: 12, plAllocation: 15, lwpAllocation: 0 }
    }
  },

  // Create leave entry (detailed with dates)
  async createLeave(leaveData: {
    employeeId: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    numberOfDays: number;
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const start = new Date(leaveData.startDate);
      const end = new Date(leaveData.endDate);
      const month = start.getMonth() + 1;
      const year = start.getFullYear();

      // Insert leave record
      const { error: insertError } = await supabase
        .from('holidays')
        .insert([{
          employeeId: leaveData.employeeId,
          month,
          year,
          leavesTaken: Math.floor(leaveData.numberOfDays),
          leaveType: leaveData.leaveType,
          startDate: leaveData.startDate,
          endDate: leaveData.endDate,
          numberOfDays: leaveData.numberOfDays.toString(),
          reason: leaveData.reason || null,
        }])

      if (insertError) {
        console.error('Error creating leave:', insertError)
        return { success: false, message: 'Failed to create leave' }
      }

      // Update leave balance
      if (leaveData.leaveType && leaveData.leaveType !== 'LWP') {
        // Initialize balance first if it doesn't exist
        await this.initializeLeaveBalance(leaveData.employeeId, year);
        
        // Get current balance
        const { data: balances } = await supabase
          .from('leaveBalances')
          .select('*')
          .eq('employeeId', leaveData.employeeId)
          .eq('leaveType', leaveData.leaveType)
          .eq('year', year)

        if (balances && balances.length > 0) {
          const currentBalance = balances[0];
          // Update existing balance
          const daysToAdd = Math.ceil(leaveData.numberOfDays);
          const newUsed = currentBalance.used + daysToAdd;
          const newBalance = currentBalance.totalAllocated + currentBalance.carriedForward - newUsed;
          
          await supabase
            .from('leaveBalances')
            .update({
              used: newUsed,
              balance: newBalance,
            })
            .eq('id', currentBalance.id)
        }
      }

      return { success: true, message: 'Leave created successfully' }
    } catch (error) {
      console.error('Error in createLeave:', error)
      return { success: false, message: 'Failed to create leave' }
    }
  },

  // Delete leave entry and update balance
  async deleteLeave(leaveId: number): Promise<{ success: boolean; message: string }> {
    try {
      // First, get the leave record to retrieve employee ID, leave type, and days
      const { data: leave, error: fetchError } = await supabase
        .from('holidays')
        .select('*')
        .eq('id', leaveId)
        .single()

      if (fetchError || !leave) {
        console.error('Error fetching leave:', fetchError)
        return { success: false, message: 'Failed to find leave record' }
      }

      const year = leave.year;
      const leaveType = leave.leaveType;
      const numberOfDays = parseFloat(leave.numberOfDays || leave.leavesTaken?.toString() || '0') || 0;
      const employeeId = leave.employeeId;

      // Delete the leave record
      const { error: deleteError } = await supabase
        .from('holidays')
        .delete()
        .eq('id', leaveId)

      if (deleteError) {
        console.error('Error deleting leave:', deleteError)
        return { success: false, message: 'Failed to delete leave' }
      }

      // Update leave balance - reverse the deduction
      if (leaveType && leaveType !== 'LWP') {
        // Get current balance
        const { data: balances } = await supabase
          .from('leaveBalances')
          .select('*')
          .eq('employeeId', employeeId)
          .eq('leaveType', leaveType)
          .eq('year', year)

        if (balances && balances.length > 0) {
          const currentBalance = balances[0];
          // Reverse the deduction: reduce used count and increase balance
          const daysToRemove = Math.ceil(numberOfDays);
          const newUsed = Math.max(0, currentBalance.used - daysToRemove);
          const newBalance = currentBalance.totalAllocated + currentBalance.carriedForward - newUsed;
          
          await supabase
            .from('leaveBalances')
            .update({
              used: newUsed,
              balance: newBalance,
            })
            .eq('id', currentBalance.id)
        }
      }

      return { success: true, message: 'Leave deleted successfully' }
    } catch (error) {
      console.error('Error in deleteLeave:', error)
      return { success: false, message: 'Failed to delete leave' }
    }
  },

  // Get leave balance for an employee
  async getLeaveBalance(employeeId: number, year: number): Promise<Record<string, { allocated: number; used: number; balance: number }>> {
    try {
      const { data, error } = await supabase
        .from('leaveBalances')
        .select('*')
        .eq('employeeId', employeeId)
        .eq('year', year)

      if (error) {
        console.error('Error fetching leave balance:', error)
        return {}
      }

      const balance: Record<string, { allocated: number; used: number; balance: number }> = {};
      data?.forEach(b => {
        balance[b.leaveType] = {
          allocated: b.totalAllocated,
          used: b.used,
          balance: b.balance,
        }
      })

      return balance
    } catch (error) {
      console.error('Error in getLeaveBalance:', error)
      return {}
    }
  },

  // Get leaves by employee
  async getLeavesByEmployee(employeeId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('employeeId', employeeId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('startDate', { ascending: false })

      if (error) {
        console.error('Error fetching leaves by employee:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getLeavesByEmployee:', error)
      return []
    }
  },

  // Initialize leave balance for an employee
  async initializeLeaveBalance(employeeId: number, year: number): Promise<void> {
    try {
      // Check if balance already exists
      const { data: existing } = await supabase
        .from('leaveBalances')
        .select('*')
        .eq('employeeId', employeeId)
        .eq('year', year)

      if (!existing || existing.length === 0) {
        // Get settings for default allocations
        const settings = await this.getSettings();
        const clAllocation = settings?.clAllocation || 12;
        const slAllocation = settings?.slAllocation || 12;
        const plAllocation = settings?.plAllocation || 15;
        
        const leaveTypes = [
          { leaveType: 'CL', totalAllocated: clAllocation },
          { leaveType: 'SL', totalAllocated: slAllocation },
          { leaveType: 'PL', totalAllocated: plAllocation },
        ];

        for (const type of leaveTypes) {
          await supabase.from('leaveBalances').insert([{
            employeeId,
            leaveType: type.leaveType,
            year,
            totalAllocated: type.totalAllocated,
            used: 0,
            balance: type.totalAllocated,
            carriedForward: 0,
          }])
        }
      }
    } catch (error) {
      console.error('Error in initializeLeaveBalance:', error)
    }
  },

  // Get company holidays
  async getCompanyHolidays(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('companyHolidays')
        .select('*')
        .eq('isActive', true)
        .order('date')

      if (error) {
        console.error('Error fetching company holidays:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getCompanyHolidays:', error)
      return []
    }
  },

  // Upload KYC document
  async uploadKycDocument(
    employeeId: number,
    file: File,
    documentType: string
  ): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, message: 'Invalid file type. Only images and PDFs are allowed.' };
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, message: 'File size must be less than 5MB' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeId}/${documentType}_${Date.now()}.${fileExt}`;
      
      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key exists:', !!supabaseKey);
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return { success: false, message: 'User not authenticated. Please log in again.' };
      }
      console.log('User authenticated:', user.email);
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Provide specific error messages
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          return { success: false, message: 'Storage bucket not configured. Please contact administrator.' };
        } else if (uploadError.message.includes('File size')) {
          return { success: false, message: 'File size exceeds limit' };
        } else if (uploadError.message.includes('Invalid file type')) {
          return { success: false, message: 'Invalid file type' };
        } else if (uploadError.message.includes('row-level security policy')) {
          return { success: false, message: 'Permission denied. Please contact administrator to configure storage policies.' };
        } else {
          return { success: false, message: `Upload failed: ${uploadError.message}` };
        }
      }

      console.log('File uploaded successfully:', uploadData);

      // For private buckets, we need to use signed URLs instead of public URLs
      // Store the file path instead of a public URL
      const filePath = uploadData.path;

      console.log('File path:', filePath);
      console.log('Original fileName:', fileName);

      // Test if we can generate a signed URL for this path
      const { data: testSignedUrl, error: testError } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 60); // 1 minute test

      if (testError) {
        console.error('Test signed URL error:', testError);
        // Try to delete the uploaded file
        await supabase.storage.from('kyc-documents').remove([fileName]);
        return { success: false, message: `File uploaded but cannot generate access URL: ${testError.message}` };
      }

      console.log('Test signed URL successful:', testSignedUrl.signedUrl);

      // Save to database
      const { error: dbError } = await supabase
        .from('employeeKycDocuments')
        .insert([{
          employeeId,
          documentType,
          documentName: file.name,
          fileUrl: filePath, // Store path instead of public URL
          fileSize: file.size,
          mimeType: file.type,
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
        // Try to delete the uploaded file
        await supabase.storage.from('kyc-documents').remove([fileName]);
        return { success: false, message: `Failed to save document metadata: ${dbError.message}` };
      }

      return { success: true, message: 'Document uploaded successfully', url: filePath };
    } catch (error) {
      console.error('Error in uploadKycDocument:', error);
      return { success: false, message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  },

  // Get KYC documents for an employee
  async getKycDocuments(employeeId: number): Promise<KycDocument[]> {
    try {
      const { data, error } = await supabase
        .from('employeeKycDocuments')
        .select('*')
        .eq('employeeId', employeeId)
        .order('uploadDate', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getKycDocuments:', error);
      return [];
    }
  },

  // Get signed URL for viewing a document
  async getDocumentSignedUrl(filePath: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log('Generating signed URL for path:', filePath);
      
      // First, let's check if the file exists by listing files in the bucket
      const { data: listData, error: listError } = await supabase.storage
        .from('kyc-documents')
        .list(filePath.split('/')[0] || '', {
          limit: 100,
          offset: 0
        });

      if (listError) {
        console.error('Error listing files:', listError);
        return { success: false, error: `Cannot access storage: ${listError.message}` };
      }

      console.log('Files in bucket:', listData);
      
      // Check if our file exists in the list
      const fileName = filePath.split('/').pop();
      const fileExists = listData?.some(file => file.name === fileName);
      
      if (!fileExists) {
        console.error('File not found in bucket:', fileName);
        return { success: false, error: `File not found: ${fileName}` };
      }

      // Generate signed URL
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return { success: false, error: error.message };
      }

      console.log('Signed URL generated successfully');
      return { success: true, url: data.signedUrl };
    } catch (error) {
      console.error('Error in getDocumentSignedUrl:', error);
      return { success: false, error: 'Failed to generate document URL' };
    }
  },

  // Verify KYC document
  async verifyKycDocument(
    documentId: number, 
    verifiedBy: number, 
    accepted: boolean, 
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('employeeKycDocuments')
        .update({
          verified: accepted,
          verifiedBy,
          verifiedAt: new Date().toISOString(),
          rejectionReason: !accepted ? reason : null,
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error verifying document:', error);
        return { success: false, message: 'Failed to verify document' };
      }

      return { success: true, message: 'Document verified successfully' };
    } catch (error) {
      console.error('Error in verifyKycDocument:', error);
      return { success: false, message: 'Failed to verify document' };
    }
  },

  // Delete KYC document
  async deleteKycDocument(documentId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Deleting document with ID:', documentId);
      
      // Get document info first to delete from storage
      const { data: doc, error: fetchError } = await supabase
        .from('employeeKycDocuments')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !doc) {
        console.error('Error fetching document:', fetchError);
        return { success: false, message: 'Document not found' };
      }

      console.log('Document found:', doc);

      // The fileUrl now contains the file path directly (e.g., "employeeId/filename.pdf")
      let filePath = doc.fileUrl;
      
      // If it's a full URL, extract the path
      if (filePath.includes('/kyc-documents/')) {
        filePath = filePath.split('/kyc-documents/')[1];
      }
      
      console.log('File path to delete:', filePath);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('kyc-documents')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
        // This handles cases where the file might not exist in storage
      } else {
        console.log('File deleted from storage successfully');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('employeeKycDocuments')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        return { success: false, message: 'Failed to delete document from database' };
      }

      console.log('Document deleted successfully');
      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      console.error('Error in deleteKycDocument:', error);
      return { success: false, message: 'Failed to delete document' };
    }
  },

  // Get all KYC documents (for admin review)
  async getAllKycDocuments(): Promise<KycDocument[]> {
    try {
      const { data, error } = await supabase
        .from('employeeKycDocuments')
        .select('*')
        .order('uploadDate', { ascending: false });

      if (error) {
        console.error('Error fetching all documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllKycDocuments:', error);
      return [];
    }
  },

  // Debug function to check specific document before deletion
  async debugDocument(documentId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Debugging document with ID:', documentId);
      
      // Get document info
      const { data: doc, error: fetchError } = await supabase
        .from('employeeKycDocuments')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !doc) {
        console.error('Error fetching document:', fetchError);
        return { success: false, error: 'Document not found' };
      }

      console.log('Document found:', doc);

      // Check if file exists in storage
      let filePath = doc.fileUrl;
      if (filePath.includes('/kyc-documents/')) {
        filePath = filePath.split('/kyc-documents/')[1];
      }

      console.log('Checking file path:', filePath);

      // List files in the directory to see what's actually there
      const directory = filePath.split('/')[0];
      const fileName = filePath.split('/').pop();

      const { data: listData, error: listError } = await supabase.storage
        .from('kyc-documents')
        .list(directory, {
          limit: 100,
          offset: 0
        });

      if (listError) {
        console.error('Error listing files:', listError);
        return { success: false, error: `Cannot list files: ${listError.message}` };
      }

      console.log('Files in directory:', listData);
      const fileExists = listData?.some(file => file.name === fileName);

      return { 
        success: true, 
        data: { 
          document: doc,
          filePath,
          directory,
          fileName,
          fileExists,
          filesInDirectory: listData
        } 
      };
    } catch (error) {
      console.error('Error in debugDocument:', error);
      return { success: false, error: 'Debug failed' };
    }
  },

  // Debug function to check storage bucket contents
  async debugStorageBucket(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Debugging storage bucket...');
      
      // List all files in the bucket
      const { data: listData, error: listError } = await supabase.storage
        .from('kyc-documents')
        .list('', {
          limit: 1000,
          offset: 0
        });

      if (listError) {
        console.error('Error listing bucket contents:', listError);
        return { success: false, error: listError.message };
      }

      console.log('Bucket contents:', listData);
      
      // Also check database records
      const { data: dbData, error: dbError } = await supabase
        .from('employeeKycDocuments')
        .select('id, employeeId, documentType, fileUrl, documentName');

      if (dbError) {
        console.error('Error fetching database records:', dbError);
        return { success: false, error: dbError.message };
      }

      console.log('Database records:', dbData);

      return { 
        success: true, 
        data: { 
          bucketFiles: listData, 
          databaseRecords: dbData 
        } 
      };
    } catch (error) {
      console.error('Error in debugStorageBucket:', error);
      return { success: false, error: 'Debug failed' };
    }
  }
}

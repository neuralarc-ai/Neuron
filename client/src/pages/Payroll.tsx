import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar as CalendarIcon, AlertTriangle, Trash } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, Employee, Payslip } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { generatePayslipPDF } from "@/lib/payslipPdf";

export default function Payroll() {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  // Fetch employees and payslips
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [employeesData, payslipsData] = await Promise.all([
          api.getEmployees(),
          api.getPayslips(),
        ]);
        setEmployees(employeesData);
        setPayslips(payslipsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setSelectedEmployees([]);
  };

  const handleGenerate = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error("Please select month and year");
      return;
    }

    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    setIsGenerating(true);
    try {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      
      // Fetch settings for leave quota and TDS rate
      const settings = await api.getSettings();
      const leaveQuota = settings?.leaveQuotaPerMonth || 2;
      const workingDays = settings?.workingDaysPerMonth || 22;
      const tdsRate = (settings?.tdsRate || 10) / 100; // Convert percentage to decimal
      
      const newPayslips = await Promise.all(
        selectedEmployees.map(async (employeeId) => {
          const employee = employees.find(emp => emp.id === employeeId);
          if (!employee) return null;

          const grossSalary = employee.salary;
          
          // Fetch leaves for this employee for the selected month/year
          const leaveData = await api.getLeavesByMonth(employeeId, month, year);
          const leavesTaken = leaveData?.leavesTaken || 0;
          
          // Calculate leave deductions
          const excessLeaves = Math.max(0, leavesTaken - leaveQuota);
          const dailySalary = grossSalary / workingDays;
          const leaveDeduction = Math.floor(dailySalary * excessLeaves);
          
          // Calculate TDS
          const tds = Math.floor(grossSalary * tdsRate);
          
          // Total deductions = TDS + Leave Deductions
          const deductions = tds + leaveDeduction;
          const netSalary = grossSalary - deductions;

          return {
            employeeId,
            month,
            year,
            grossSalary,
            tds,
            deductions,
            netSalary,
          };
        })
      );

      const validPayslips = newPayslips.filter(Boolean) as Omit<Payslip, 'id' | 'createdAt'>[];
      
      // Save to database
      const result = await api.createPayslips(validPayslips);
      
      if (result.success && result.data) {
        setPayslips(prev => [...result.data!, ...prev]);
        toast.success(result.message);
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error generating payslips:', error);
      toast.error("Failed to generate payslips");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (payslipId: number) => {
    try {
      const payslip = payslips.find(p => p.id === payslipId);
      if (!payslip) {
        toast.error("Payslip not found");
        return;
      }

      const employee = employees.find(e => e.id === payslip.employeeId);
      if (!employee) {
        toast.error("Employee not found");
        return;
      }

      const monthName = months.find(m => m.value === payslip.month.toString())?.label || payslip.month.toString();
      
      // Calculate salary breakdown
      const basic = Math.floor(payslip.grossSalary * 0.5);
      const hra = Math.floor(payslip.grossSalary * 0.3);
      const otherAllowances = payslip.grossSalary - basic - hra;
      
      // Get leaves data from database
      const settings = await api.getSettings();
      const leaveQuota = settings?.leaveQuotaPerMonth || 2;
      const workingDays = settings?.workingDaysPerMonth || 22;
      const tdsRate = settings?.tdsRate || 10;
      
      const leaveData = await api.getLeavesByMonth(employee.id, payslip.month, payslip.year);
      const leavesTaken = leaveData?.leavesTaken || 0;
      const excessLeaves = Math.max(0, leavesTaken - leaveQuota);
      const dailySalary = payslip.grossSalary / workingDays;
      const leaveDeduction = Math.floor(dailySalary * excessLeaves);
      
      // Prepare PDF data
      const pdfData = {
        employee: {
          name: employee.name,
          designation: employee.designation,
          employeeId: `EMP${employee.id}`,
          agreementRefId: employee.agreementRefId,
        },
        period: {
          month: monthName,
          year: payslip.year,
        },
        salary: {
          basic,
          hra,
          otherAllowances,
          gross: payslip.grossSalary,
          tds: payslip.tds,
          leaveDeduction,
          netSalary: payslip.netSalary,
        },
        leaves: {
          taken: leavesTaken,
          quota: leaveQuota,
          excess: excessLeaves,
        },
        settings: {
          workingDays,
          tdsRate,
        },
      };

      // Generate and download PDF
      await generatePayslipPDF(pdfData);
      
      toast.success("Payment advice downloaded successfully");
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error("Failed to download payment advice");
    }
  };

  const handleDelete = async (payslipId: number) => {
    if (!window.confirm("Are you sure you want to delete this payslip? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await api.deletePayslip(payslipId);
      
      if (result.success) {
        setPayslips(prev => prev.filter(p => p.id !== payslipId));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting payslip:', error);
      toast.error("Failed to delete payslip");
    }
  };

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee?.name || "Unknown";
  };

  const getEmployeeDesignation = (employeeId: number) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee?.designation || "";
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payroll</h1>
            <p className="text-muted-foreground mt-1">Generate and manage employee payslips</p>
          </div>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Generate Payment Advice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payment Advice</DialogTitle>
                <DialogDescription>
                  Select the month and year to generate payslips for all active employees
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month *</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Employees *</Label>
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {employees.filter(emp => emp.status === 'active').map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmployees(prev => [...prev, employee.id]);
                            } else {
                              setSelectedEmployees(prev => prev.filter(id => id !== employee.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`employee-${employee.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {employee.designation} • {formatCurrency(employee.salary)}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedEmployees.length} employee(s) selected
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    This will generate payslips for all active employees for the selected period.
                    Salary calculations will include TDS deductions and leave-based deductions.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bento-card animate-pulse">
                <div className="h-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : payslips.length === 0 ? (
          <div className="bento-card text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No payslips generated yet. Click "Generate Payment Advice" to create payslips for a specific month.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(
              payslips.reduce((acc, payslip) => {
                const key = `${payslip.year}-${payslip.month}`;
                if (!acc[key]) {
                  acc[key] = [];
                }
                acc[key].push(payslip);
                return acc;
              }, {} as Record<string, typeof payslips>)
            ).map(([period, payslipGroup]) => {
              const [year, month] = period.split('-');
              const monthName = months.find(m => m.value === month)?.label || month;
              
              return (
                <div key={period} className="bento-card">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <CalendarIcon className="h-5 w-5 text-[rgb(var(--lavander))" />
                    <h2 className="text-xl font-semibold">
                      {monthName} {year}
                    </h2>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {payslipGroup.length} payslip{payslipGroup.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {payslipGroup.map((payslip) => {
                      const employee = employees.find(e => e.id === payslip.employeeId);
                      return (
                        <div key={payslip.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <h3 className="font-semibold">{employee?.name || 'Unknown'}</h3>
                            <p className="text-sm text-muted-foreground">{employee?.designation || ''}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Gross Salary</p>
                              <p className="font-semibold">{formatCurrency(payslip.grossSalary)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Deductions</p>
                              <p className="font-semibold text-[rgb(var(--tangerine))]">-{formatCurrency(payslip.deductions)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Net Salary</p>
                              <p className="font-bold text-lg text-[rgb(var(--tea))]">{formatCurrency(payslip.netSalary)}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleDownload(payslip.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleDelete(payslip.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


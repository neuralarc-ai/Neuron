import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, Employee, Payslip } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";

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
      const tdsRate = 0.10; // 10% TDS
      
      const newPayslips = selectedEmployees.map((employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) return null;

        const grossSalary = employee.salary;
        const tds = Math.floor(grossSalary * tdsRate);
        const deductions = tds;
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
      }).filter(Boolean) as Omit<Payslip, 'id' | 'createdAt'>[];

      // Save to database
      const result = await api.createPayslips(newPayslips);
      
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
      
      // Create PDF content
      const monthName = months.find(m => m.value === payslip.month.toString())?.label || payslip.month.toString();
      const pdfContent = `PAYMENT ADVICE\n\nEmployee: ${employee?.name || 'Unknown'}\nDesignation: ${employee?.designation || 'N/A'}\nPeriod: ${monthName} ${payslip.year}\n\nGross Salary: ₹${payslip.grossSalary.toLocaleString('en-IN')}\nTDS Deduction: ₹${payslip.tds.toLocaleString('en-IN')}\nOther Deductions: ₹${(payslip.deductions - payslip.tds).toLocaleString('en-IN')}\n\nNet Salary: ₹${payslip.netSalary.toLocaleString('en-IN')}\n\nGenerated on: ${new Date().toLocaleDateString()}`;
      
      // Create and download PDF
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payment-Advice-${employee?.name}-${monthName}-${payslip.year}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Payment advice downloaded successfully");
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error("Failed to download payment advice");
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

                {showLeaveWarning && (
                  <Alert className="border-[rgb(var(--tangerine))] bg-[rgb(var(--tangerine))]/10">
                    <AlertTriangle className="h-4 w-4 text-[rgb(var(--tangerine))]" />
                    <AlertDescription className="text-sm">
                      <p className="font-semibold mb-2">Leave records missing for:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {missingEmployees.map((name, idx) => (
                          <li key={idx}>{name}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs">
                        Please record leaves for these employees before generating payslips, or continue to generate with zero leaves.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

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
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleDownload(payslip.id)}
                              className="ml-4"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
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


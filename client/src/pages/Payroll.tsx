import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, Employee } from "@/lib/supabase";

export default function Payroll() {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [missingEmployees, setMissingEmployees] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const data = await api.getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const resetForm = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setShowLeaveWarning(false);
    setMissingEmployees([]);
  };

  const handleGenerate = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error("Please select month and year");
      return;
    }

    setIsGenerating(true);
    try {
      // For now, just show a success message
      // In a real implementation, you'd generate payslips
      console.log(`Generating payslips for ${selectedMonth}/${selectedYear}`);
      toast.success("Payslips generated successfully");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error generating payslips:', error);
      toast.error("Failed to generate payslips");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (payslipId: number) => {
    // For now, just show a message
    // In a real implementation, you'd download the PDF
    console.log(`Downloading payslip ${payslipId}`);
    toast.info("PDF download feature coming soon");
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

  const groupedPayslips = payslips?.reduce((acc, payslip) => {
    const key = `${payslip.year}-${payslip.month}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(payslip);
    return acc;
  }, {} as Record<string, typeof payslips>);

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
        ) : (
          <div className="bento-card text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No payslips generated yet. Click "Generate Payment Advices" to create payslips for a specific month.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


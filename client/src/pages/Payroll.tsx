import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Payroll() {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [missingEmployees, setMissingEmployees] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const { data: payslips, isLoading } = trpc.payslips.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const checkLeavesMutation = trpc.leaves.checkAllRecorded.useQuery(
    {
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    },
    {
      enabled: false,
    }
  );

  const generateMutation = trpc.payslips.generate.useMutation({
    onSuccess: (data) => {
      utils.payslips.list.invalidate();
      const created = data.results.filter(r => r.status === 'created').length;
      const existing = data.results.filter(r => r.status === 'already_exists').length;
      
      if (created > 0) {
        toast.success(`Generated ${created} payslip(s) successfully`);
      }
      if (existing > 0) {
        toast.info(`${existing} payslip(s) already exist for this period`);
      }
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to generate payslips"),
  });

  const downloadMutation = trpc.payslips.downloadPdf.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Payslip downloaded successfully");
    },
    onError: () => toast.error("Failed to download payslip"),
  });

  const resetForm = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setShowLeaveWarning(false);
    setMissingEmployees([]);
  };

  const handleCheckLeaves = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error("Please select month and year");
      return;
    }

    const result = await checkLeavesMutation.refetch();
    
    if (result.data?.allRecorded) {
      setShowLeaveWarning(false);
      setMissingEmployees([]);
      handleGenerate();
    } else {
      setShowLeaveWarning(true);
      setMissingEmployees(result.data?.missingEmployees || []);
    }
  };

  const handleGenerate = () => {
    generateMutation.mutate({
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    });
  };

  const handleDownload = (payslipId: number) => {
    downloadMutation.mutate({ payslipId });
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
                Generate Payslips
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payslips</DialogTitle>
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
                  {showLeaveWarning ? (
                    <Button 
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                      variant="destructive"
                    >
                      {generateMutation.isPending ? "Generating..." : "Continue Anyway"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCheckLeaves}
                      disabled={generateMutation.isPending || checkLeavesMutation.isFetching}
                    >
                      {checkLeavesMutation.isFetching ? "Checking..." : "Generate"}
                    </Button>
                  )}
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
        ) : payslips && payslips.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedPayslips || {})
              .sort((a, b) => {
                const [yearA, monthA] = a[0].split('-').map(Number);
                const [yearB, monthB] = b[0].split('-').map(Number);
                return yearB - yearA || monthB - monthA;
              })
              .map(([key, periodPayslips]) => {
                const [year, month] = key.split('-').map(Number);
                const monthName = months.find(m => m.value === month.toString())?.label;
                const totalGross = periodPayslips.reduce((sum, p) => sum + p.grossSalary, 0);
                const totalNet = periodPayslips.reduce((sum, p) => sum + p.netSalary, 0);
                const totalTds = periodPayslips.reduce((sum, p) => sum + p.tds, 0);
                const totalDeductions = periodPayslips.reduce((sum, p) => sum + p.deductions, 0);

                return (
                  <div key={key} className="space-y-4">
                    <div className="bento-card bg-gradient-to-br from-[rgb(var(--lavander))]/10 to-[rgb(var(--sky))]/10 border-[rgb(var(--lavander))]/20">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold">{monthName} {year}</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {periodPayslips.length} employee(s)
                          </p>
                        </div>
                        <CalendarIcon className="h-6 w-6 text-[rgb(var(--lavander))]" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Gross Salary</p>
                          <p className="text-lg font-semibold mt-1">{formatCurrency(totalGross)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">TDS</p>
                          <p className="text-lg font-semibold mt-1 text-[rgb(var(--tangerine))]">
                            {formatCurrency(totalTds)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Deductions</p>
                          <p className="text-lg font-semibold mt-1 text-[rgb(var(--red-passion))]">
                            {formatCurrency(totalDeductions)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Net Salary</p>
                          <p className="text-lg font-semibold mt-1 text-[rgb(var(--tea))]">
                            {formatCurrency(totalNet)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {periodPayslips.map((payslip) => (
                        <div key={payslip.id} className="bento-card">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold text-lg">{getEmployeeName(payslip.employeeId)}</h3>
                              <p className="text-sm text-muted-foreground">
                                {getEmployeeDesignation(payslip.employeeId)}
                              </p>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Gross Salary</span>
                                <span className="font-medium">{formatCurrency(payslip.grossSalary)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">TDS (10%)</span>
                                <span className="font-medium text-[rgb(var(--tangerine))]">
                                  - {formatCurrency(payslip.tds)}
                                </span>
                              </div>
                              {payslip.deductions > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Leave Deductions</span>
                                  <span className="font-medium text-[rgb(var(--red-passion))]">
                                    - {formatCurrency(payslip.deductions)}
                                  </span>
                                </div>
                              )}
                              <div className="pt-2 border-t border-border flex justify-between">
                                <span className="font-semibold">Net Salary</span>
                                <span className="font-semibold text-[rgb(var(--tea))]">
                                  {formatCurrency(payslip.netSalary)}
                                </span>
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleDownload(payslip.id)}
                              disabled={downloadMutation.isPending}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {downloadMutation.isPending ? "Downloading..." : "Download PDF"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="bento-card text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No payslips generated yet. Click "Generate Payslips" to create payslips for a specific month.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


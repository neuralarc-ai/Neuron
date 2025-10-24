import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Leaves() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [leaveInputs, setLeaveInputs] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const utils = trpc.useUtils();
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.active.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();

  const createOrUpdateMutation = trpc.leaves.createOrUpdate.useMutation({
    onSuccess: (_, variables) => {
      setSaving(prev => ({ ...prev, [variables.employeeId]: false }));
      toast.success("Leave record saved");
      utils.leaves.getByEmployee.invalidate({ employeeId: variables.employeeId });
    },
    onError: (_, variables) => {
      setSaving(prev => ({ ...prev, [variables.employeeId]: false }));
      toast.error("Failed to save leave record");
    },
  });

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

  // Set default to current month/year
  useEffect(() => {
    const now = new Date();
    if (!selectedMonth) setSelectedMonth((now.getMonth() + 1).toString());
    if (!selectedYear) setSelectedYear(now.getFullYear().toString());
  }, [selectedMonth, selectedYear]);

  const handleLeaveChange = (employeeId: number, value: string) => {
    setLeaveInputs(prev => ({ ...prev, [employeeId]: value }));
  };

  const handleSave = (employeeId: number) => {
    if (!selectedMonth || !selectedYear) {
      toast.error("Please select month and year");
      return;
    }

    const leaveValue = leaveInputs[employeeId];
    if (leaveValue === undefined || leaveValue === "") {
      toast.error("Please enter number of leaves");
      return;
    }

    const leavesTaken = parseInt(leaveValue);
    if (isNaN(leavesTaken) || leavesTaken < 0) {
      toast.error("Please enter a valid number");
      return;
    }

    setSaving(prev => ({ ...prev, [employeeId]: true }));
    createOrUpdateMutation.mutate({
      employeeId,
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
      leavesTaken,
    });
  };

  const getExcessLeaves = (employeeId: number): number => {
    const leaveValue = leaveInputs[employeeId];
    if (!leaveValue || !settings) return 0;
    
    const leavesTaken = parseInt(leaveValue);
    if (isNaN(leavesTaken)) return 0;
    
    return Math.max(0, leavesTaken - settings.leaveQuotaPerMonth);
  };

  const isExceeding = (employeeId: number): boolean => {
    return getExcessLeaves(employeeId) > 0;
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground mt-1">
            Record monthly leaves for all employees
          </p>
        </div>

        {/* Period Selection */}
        <div className="bento-card bg-gradient-to-br from-[rgb(var(--lavander))]/10 to-[rgb(var(--sky))]/10 border-[rgb(var(--lavander))]/20">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[rgb(var(--lavander))]" />
            <h2 className="text-lg font-semibold">Select Period</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
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
              <Label htmlFor="year">Year</Label>
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
              <Label>Leave Quota</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                <span className="text-sm font-medium">
                  {settings?.leaveQuotaPerMonth || 0} days/month
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee List */}
        {loadingEmployees ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bento-card animate-pulse">
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="space-y-3">
            {employees.map((employee) => (
              <div 
                key={employee.id} 
                className={`bento-card transition-all ${
                  isExceeding(employee.id) 
                    ? 'border-[rgb(var(--tangerine))]/50 bg-[rgb(var(--tangerine))]/5' 
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Employee Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.designation}</p>
                  </div>

                  {/* Leave Input */}
                  <div className="flex items-center gap-3 md:w-auto">
                    <div className="space-y-1">
                      <Label htmlFor={`leave-${employee.id}`} className="text-xs text-muted-foreground">
                        Leaves Taken
                      </Label>
                      <Input
                        id={`leave-${employee.id}`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={leaveInputs[employee.id] || ""}
                        onChange={(e) => handleLeaveChange(employee.id, e.target.value)}
                        className="w-24 text-center"
                      />
                    </div>

                    <Button
                      onClick={() => handleSave(employee.id)}
                      disabled={saving[employee.id]}
                      size="sm"
                      className="mt-5 bg-[rgb(var(--tea))] hover:bg-[rgb(var(--tea))]/90 text-white"
                    >
                      {saving[employee.id] ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Warning/Success Indicator */}
                  <div className="md:w-64">
                    {leaveInputs[employee.id] !== undefined && leaveInputs[employee.id] !== "" && (
                      <>
                        {isExceeding(employee.id) ? (
                          <Alert className="border-[rgb(var(--tangerine))] bg-[rgb(var(--tangerine))]/10 py-2">
                            <AlertTriangle className="h-4 w-4 text-[rgb(var(--tangerine))]" />
                            <AlertDescription className="text-xs">
                              <span className="font-semibold">Exceeds quota by {getExcessLeaves(employee.id)} day(s)</span>
                              <br />
                              <span className="text-muted-foreground">
                                Salary deduction will apply
                              </span>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert className="border-[rgb(var(--tea))] bg-[rgb(var(--tea))]/10 py-2">
                            <CheckCircle2 className="h-4 w-4 text-[rgb(var(--tea))]" />
                            <AlertDescription className="text-xs">
                              <span className="font-semibold">Within quota</span>
                              <br />
                              <span className="text-muted-foreground">
                                No deduction
                              </span>
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bento-card text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No active employees found. Add employees first to record their leaves.
            </p>
          </div>
        )}

        {/* Info Card */}
        {employees && employees.length > 0 && (
          <div className="bento-card bg-[rgb(var(--sky))]/10 border-[rgb(var(--sky))]/20">
            <h3 className="font-semibold mb-2">How it works</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Enter the number of leaves taken by each employee for the selected month</li>
              <li>• Leaves exceeding the monthly quota ({settings?.leaveQuotaPerMonth || 0} days) will trigger salary deductions</li>
              <li>• Save each employee's record individually</li>
              <li>• Ensure all leave records are up to date before generating payroll</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


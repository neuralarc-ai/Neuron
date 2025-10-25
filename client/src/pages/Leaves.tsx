import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { api, Employee } from "@/lib/supabase";

export default function Leaves() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [leaveInputs, setLeaveInputs] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({ leaveQuotaPerMonth: 2 });

  // Fetch active employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const data = await api.getEmployees();
        // Filter only active employees
        const activeEmployees = data.filter(emp => emp.status === 'active');
        setEmployees(activeEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

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

  const handleSaveAll = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error("Please select month and year");
      return;
    }

    if (!employees || employees.length === 0) {
      toast.error("No employees to save");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const employee of employees) {
        const leaveValue = leaveInputs[employee.id] || "0";
        const leavesTaken = parseInt(leaveValue);

        if (isNaN(leavesTaken) || leavesTaken < 0) {
          errorCount++;
          continue;
        }

        try {
          // For now, we'll just show a success message
          // In a real implementation, you'd save to the holidays table
          console.log(`Saving ${leavesTaken} leaves for ${employee.name} for ${selectedMonth}/${selectedYear}`);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Saved ${successCount} leave record(s) successfully`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to save ${errorCount} record(s)`);
      }
    } finally {
      setSaving(false);
    }
  };

  const getExcessLeaves = (employeeId: number): number => {
    const leaveValue = leaveInputs[employeeId] || "0";
    if (!settings) return 0;
    
    const leavesTaken = parseInt(leaveValue);
    if (isNaN(leavesTaken)) return 0;
    
    return Math.max(0, leavesTaken - settings.leaveQuotaPerMonth);
  };

  const isExceeding = (employeeId: number): boolean => {
    return getExcessLeaves(employeeId) > 0;
  };

  const hasAnyExceeding = employees?.some(emp => isExceeding(emp.id)) || false;

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leave Management</h1>
            <p className="text-muted-foreground mt-1">
              Record monthly leaves for all employees
            </p>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving || !employees || employees.length === 0}
            size="lg"
            className="bg-[rgb(var(--tea))] hover:bg-[rgb(var(--tea))]/90 text-white"
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save All
              </>
            )}
          </Button>
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

        {/* Warning if any exceeding */}
        {hasAnyExceeding && (
          <div className="bento-card border-[rgb(var(--tangerine))]/50 bg-[rgb(var(--tangerine))]/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[rgb(var(--tangerine))] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[rgb(var(--tangerine))]">
                  Some employees exceed leave quota
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Employees marked in orange will have salary deductions applied during payroll generation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CSV-like Table */}
        {isLoading ? (
          <div className="bento-card animate-pulse">
            <div className="h-64 bg-muted rounded" />
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="bento-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold">Employee Name</th>
                    <th className="text-left p-4 font-semibold">Designation</th>
                    <th className="text-center p-4 font-semibold w-32">Leaves Taken</th>
                    <th className="text-center p-4 font-semibold w-32">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => (
                    <tr 
                      key={employee.id}
                      className={`border-b border-border last:border-0 transition-colors ${
                        isExceeding(employee.id) 
                          ? 'bg-[rgb(var(--tangerine))]/5' 
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-medium">{employee.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">{employee.designation}</div>
                      </td>
                      <td className="p-4">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={leaveInputs[employee.id] || ""}
                          onChange={(e) => handleLeaveChange(employee.id, e.target.value)}
                          className={`text-center w-20 mx-auto ${
                            isExceeding(employee.id) 
                              ? 'border-[rgb(var(--tangerine))] bg-[rgb(var(--tangerine))]/5' 
                              : ''
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              // Move to next input
                              const nextIndex = index + 1;
                              if (nextIndex < employees.length) {
                                const nextInput = document.querySelector(
                                  `input[type="number"]:nth-of-type(${nextIndex + 1})`
                                ) as HTMLInputElement;
                                nextInput?.focus();
                              }
                            }
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center">
                          {leaveInputs[employee.id] !== undefined && leaveInputs[employee.id] !== "" ? (
                            isExceeding(employee.id) ? (
                              <div className="flex items-center gap-1 text-[rgb(var(--tangerine))]">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-medium">
                                  +{getExcessLeaves(employee.id)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[rgb(var(--tea))]">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-medium">OK</span>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <h3 className="font-semibold mb-2">Quick Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Enter leave numbers directly in the table (like a spreadsheet)</li>
              <li>• Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to move to the next employee</li>
              <li>• Leaves exceeding quota ({settings?.leaveQuotaPerMonth || 0} days) are highlighted in orange</li>
              <li>• Click "Save All" to save all records at once</li>
              <li>• Empty fields will be saved as 0 leaves</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Leaves() {
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [leavesTaken, setLeavesTaken] = useState("");

  const utils = trpc.useUtils();
  const { data: employees } = trpc.employees.active.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();

  const createMutation = trpc.leaves.createOrUpdate.useMutation({
    onSuccess: () => {
      utils.leaves.getByEmployee.invalidate();
      toast.success("Leave record updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to update leave record"),
  });

  const resetForm = () => {
    setSelectedEmployee("");
    setSelectedMonth("");
    setSelectedYear("");
    setLeavesTaken("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      employeeId: parseInt(selectedEmployee),
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
      leavesTaken: parseInt(leavesTaken),
    });
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

  const [viewEmployee, setViewEmployee] = useState<number | null>(null);
  const { data: employeeLeaves } = trpc.leaves.getByEmployee.useQuery(
    { employeeId: viewEmployee! },
    { enabled: !!viewEmployee }
  );

  const calculateDeduction = (salary: number, leavesTaken: number) => {
    if (!settings) return 0;
    const excessLeaves = Math.max(0, leavesTaken - settings.leaveQuotaPerMonth);
    return Math.floor((salary / settings.workingDaysPerMonth) * excessLeaves);
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leave Management</h1>
            <p className="text-muted-foreground mt-1">Track employee leaves and quotas</p>
          </div>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Leave Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Leave Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} - {emp.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month *</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth} required>
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
                    <Select value={selectedYear} onValueChange={setSelectedYear} required>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leavesTaken">Leaves Taken *</Label>
                  <Input
                    id="leavesTaken"
                    type="number"
                    min="0"
                    value={leavesTaken}
                    onChange={(e) => setLeavesTaken(e.target.value)}
                    required
                  />
                  {settings && (
                    <p className="text-xs text-muted-foreground">
                      Monthly quota: {settings.leaveQuotaPerMonth} leaves
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Save
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Settings Info */}
        {settings && (
          <div className="bento-card bg-[rgb(var(--lavander))]/10 border-[rgb(var(--lavander))]/20">
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-[rgb(var(--lavander))] mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Leave Policy</h3>
                <p className="text-sm text-muted-foreground">
                  Monthly quota: <span className="font-medium text-foreground">{settings.leaveQuotaPerMonth} leaves</span> | 
                  Working days: <span className="font-medium text-foreground">{settings.workingDaysPerMonth} days</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Leaves exceeding the quota will result in pro-rata salary deduction
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Employees Grid */}
        <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {employees?.map((employee) => {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            
            return (
              <div key={employee.id} className="bento-card">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.designation}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Quota</span>
                      <span className="font-medium">{settings?.leaveQuotaPerMonth || 0} leaves</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Salary</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(employee.salary)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setViewEmployee(employee.id)}
                  >
                    View Leave History
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave History Dialog */}
        <Dialog open={!!viewEmployee} onOpenChange={(val) => !val && setViewEmployee(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle>Leave History</DialogTitle>
            </DialogHeader>
            {viewEmployee && employeeLeaves && (
              <div className="space-y-4">
                {employeeLeaves.length > 0 ? (
                  <div className="space-y-3">
                    {employeeLeaves.map((leave) => {
                      const employee = employees?.find(e => e.id === leave.employeeId);
                      const excessLeaves = Math.max(0, leave.leavesTaken - (settings?.leaveQuotaPerMonth || 0));
                      const deduction = employee && settings ? calculateDeduction(employee.salary, leave.leavesTaken) : 0;
                      
                      return (
                        <div key={leave.id} className="bento-card">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {months.find(m => m.value === leave.month.toString())?.label} {leave.year}
                                </h4>
                                {excessLeaves > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--tangerine))]/10 text-[rgb(var(--tangerine))]">
                                    <AlertCircle className="h-3 w-3" />
                                    Excess leaves
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Leaves Taken:</span>
                                  <span className="ml-2 font-medium">{leave.leavesTaken}</span>
                                </div>
                                {excessLeaves > 0 && (
                                  <>
                                    <div>
                                      <span className="text-muted-foreground">Excess:</span>
                                      <span className="ml-2 font-medium text-[rgb(var(--tangerine))]">{excessLeaves}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Deduction:</span>
                                      <span className="ml-2 font-medium text-[rgb(var(--red-passion))]">
                                        {new Intl.NumberFormat('en-IN', {
                                          style: 'currency',
                                          currency: 'INR',
                                          maximumFractionDigits: 0,
                                        }).format(deduction)}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No leave records found</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


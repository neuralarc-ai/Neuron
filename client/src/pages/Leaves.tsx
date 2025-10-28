import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, AlertTriangle, CheckCircle2, Save, Plus, History, BarChart, Calendar as CalendarIcon, Trash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { api, Employee } from "@/lib/supabase";

export default function Leaves() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [leaveInputs, setLeaveInputs] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({ leaveQuotaPerMonth: 2 });

  // New state for date-wise entry
  const [showAddLeaveDialog, setShowAddLeaveDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState("CL");
  const [reason, setReason] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  
  // Leave history
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<number, any>>({});
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState("");
  
  // State for displaying leaves in Add Leave tab
  const [employeeLeavesList, setEmployeeLeavesList] = useState<any[]>([]);
  
  // State for monthly summary leaves data
  const [monthlyLeavesData, setMonthlyLeavesData] = useState<Record<number, number>>({});
  const [loadingMonthlyData, setLoadingMonthlyData] = useState(false);

  // Load leave history
  useEffect(() => {
    const loadLeaveHistory = async () => {
      if (selectedEmployeeForHistory && selectedEmployeeForHistory !== "all") {
        try {
          const history = await api.getLeavesByEmployee(parseInt(selectedEmployeeForHistory));
          setLeaveHistory(history);
        } catch (error) {
          console.error('Error loading leave history:', error);
          setLeaveHistory([]);
        }
      } else {
        // Load all leaves for all employees
        try {
          const allHistory: any[] = [];
          for (const emp of employees) {
            const history = await api.getLeavesByEmployee(emp.id);
            allHistory.push(...history);
          }
          // Sort by date descending
          allHistory.sort((a, b) => {
            if (a.startDate && b.startDate) {
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            }
            return b.year - a.year || b.month - a.month;
          });
          setLeaveHistory(allHistory);
        } catch (error) {
          console.error('Error loading leave history:', error);
          setLeaveHistory([]);
        }
      }
    };
    
    if (selectedEmployeeForHistory) {
      loadLeaveHistory();
    } else {
      setLeaveHistory([]);
    }
  }, [selectedEmployeeForHistory, employees]);

  // Load leave balances for all employees
  useEffect(() => {
    const loadLeaveBalances = async () => {
      if (employees.length > 0) {
        try {
          const currentYear = new Date().getFullYear();
          const balances: Record<number, any> = {};
          
          // Initialize balances for all employees first if they don't exist
          for (const emp of employees) {
            await api.initializeLeaveBalance(emp.id, currentYear);
          }
          
          // Then load balances
          for (const emp of employees) {
            const balance = await api.getLeaveBalance(emp.id, currentYear);
            balances[emp.id] = balance;
          }
          
          setLeaveBalances(balances);
        } catch (error) {
          console.error('Error loading leave balances:', error);
        }
      }
    };
    loadLeaveBalances();
  }, [employees]);

  // Fetch active employees and load existing leaves
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

  // Load existing leaves when month/year changes
  useEffect(() => {
    if (!selectedMonth || !selectedYear || !employees || employees.length === 0) {
      return;
    }

    const loadExistingLeaves = async () => {
      try {
        const newLeaveInputs: Record<number, string> = {};
        
        for (const employee of employees) {
          const leave = await api.getLeavesByMonth(
            employee.id,
            parseInt(selectedMonth),
            parseInt(selectedYear)
          );
          
          if (leave) {
            newLeaveInputs[employee.id] = leave.leavesTaken.toString();
          }
        }

        setLeaveInputs(newLeaveInputs);
      } catch (error) {
        console.error('Error loading leaves:', error);
      }
    };

    loadExistingLeaves();
  }, [selectedMonth, selectedYear, employees]);

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
          // Save to database via API
          const result = await api.createOrUpdateLeave({
            employeeId: employee.id,
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
            leavesTaken: leavesTaken,
          });

          if (result.success) {
          successCount++;
          } else {
            errorCount++;
          }
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

  // Handler for new date-wise leave entry
  const handleAddLeave = async () => {
    if (!selectedEmployee || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const result = await api.createLeave({
        employeeId: parseInt(selectedEmployee),
        leaveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        numberOfDays,
        reason: reason || undefined,
      });

      if (result.success) {
        toast.success("Leave added successfully");
        setShowAddLeaveDialog(false);
        setSelectedEmployee("");
        setStartDate(undefined);
        setEndDate(undefined);
        setReason("");
        
        // Refresh leave balances
        const currentYear = new Date().getFullYear();
        
        // Initialize balance for the selected employee if needed
        await api.initializeLeaveBalance(parseInt(selectedEmployee), currentYear);
        
        // Reload all balances
        const balances: Record<number, any> = {};
        for (const emp of employees) {
          const balance = await api.getLeaveBalance(emp.id, currentYear);
          balances[emp.id] = balance;
        }
        setLeaveBalances(balances);
        
        // Refresh leave history if on history tab
        if (activeTab === 'history') {
          if (selectedEmployeeForHistory && selectedEmployeeForHistory !== "all") {
            const history = await api.getLeavesByEmployee(parseInt(selectedEmployeeForHistory));
            setLeaveHistory(history);
          } else if (selectedEmployeeForHistory === "all") {
            // Load all leaves for all employees
            const allHistory: any[] = [];
            for (const emp of employees) {
              const history = await api.getLeavesByEmployee(emp.id);
              allHistory.push(...history);
            }
            allHistory.sort((a, b) => {
              if (a.startDate && b.startDate) {
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
              }
              return b.year - a.year || b.month - a.month;
            });
            setLeaveHistory(allHistory);
          }
        }
        
        // Refresh employee leaves list in Add Leave tab
        if (activeTab === 'add') {
          const allLeaves: any[] = [];
          for (const emp of employees) {
            const history = await api.getLeavesByEmployee(emp.id);
            allLeaves.push(...history);
          }
          // Sort by date descending (most recent first)
          allLeaves.sort((a, b) => {
            if (a.startDate && b.startDate) {
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            }
            return b.year - a.year || b.month - a.month;
          });
          setEmployeeLeavesList(allLeaves.slice(0, 10)); // Show last 10 leaves
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error adding leave:', error);
      toast.error("Failed to add leave");
    }
  };

  // Calculate number of days
  const calculatedDays = () => {
    if (!startDate || !endDate) return 0;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Handle delete leave entry
  const handleDeleteLeave = async (leaveId: number) => {
    if (!confirm("Are you sure you want to delete this leave entry?")) {
      return;
    }

    try {
      const result = await api.deleteLeave(leaveId);
      if (result.success) {
        toast.success(result.message);
        
        // Reload recent leaves
        if (activeTab === 'add') {
          const allLeaves: any[] = [];
          for (const emp of employees) {
            const history = await api.getLeavesByEmployee(emp.id);
            allLeaves.push(...history);
          }
          // Sort by date descending (most recent first)
          allLeaves.sort((a, b) => {
            if (a.startDate && b.startDate) {
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            }
            return b.year - a.year || b.month - a.month;
          });
          setEmployeeLeavesList(allLeaves.slice(0, 10));
        }
        
        // Reload leave balances
        const currentYear = new Date().getFullYear();
        const balances: Record<number, any> = {};
        for (const emp of employees) {
          const balance = await api.getLeaveBalance(emp.id, currentYear);
          balances[emp.id] = balance;
        }
        setLeaveBalances(balances);
        
        // Reload leave history if on history tab
        if (activeTab === 'history') {
          if (selectedEmployeeForHistory && selectedEmployeeForHistory !== "all") {
            const history = await api.getLeavesByEmployee(parseInt(selectedEmployeeForHistory));
            setLeaveHistory(history);
          } else if (selectedEmployeeForHistory === "all") {
            const allHistory: any[] = [];
            for (const emp of employees) {
              const history = await api.getLeavesByEmployee(emp.id);
              allHistory.push(...history);
            }
            allHistory.sort((a, b) => {
              if (a.startDate && b.startDate) {
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
              }
              return b.year - a.year || b.month - a.month;
            });
            setLeaveHistory(allHistory);
          }
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting leave:', error);
      toast.error("Failed to delete leave");
    }
  };

  const leaveTypes = [
    { value: "CL", label: "Casual Leave (CL)" },
    { value: "SL", label: "Sick Leave (SL)" },
    { value: "PL", label: "Privilege Leave (PL)" },
    { value: "HalfDay", label: "Half Day" },
    { value: "LWP", label: "Leave Without Pay (LWP)" },
  ];

  // Load recent leaves on tab change
  useEffect(() => {
    const loadRecentLeaves = async () => {
      if (activeTab === 'add' && employees.length > 0) {
        try {
          const allLeaves: any[] = [];
          for (const emp of employees) {
            const history = await api.getLeavesByEmployee(emp.id);
            allLeaves.push(...history);
          }
          // Sort by date descending (most recent first)
          allLeaves.sort((a, b) => {
            if (a.startDate && b.startDate) {
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            }
            return b.year - a.year || b.month - a.month;
          });
          setEmployeeLeavesList(allLeaves.slice(0, 10)); // Show last 10 leaves
        } catch (error) {
          console.error('Error loading recent leaves:', error);
        }
      }
    };
    
    loadRecentLeaves();
  }, [activeTab, employees]);

  // Load monthly leaves data
  useEffect(() => {
    const loadMonthlyLeaves = async () => {
      if ((activeTab === 'monthly' || activeTab === '') && employees.length > 0 && selectedMonth && selectedYear) {
        setLoadingMonthlyData(true);
        try {
          const monthNum = parseInt(selectedMonth);
          const yearNum = parseInt(selectedYear);
          const leavesData: Record<number, number> = {};
          
          // Fetch leaves for all employees for the selected month
          for (const emp of employees) {
            const leaves = await api.getLeavesByMonth(emp.id, monthNum, yearNum);
            // Sum up the total days
            let totalDays = 0;
            for (const leave of leaves) {
              totalDays += (leave.leavesTaken || 0);
            }
            leavesData[emp.id] = totalDays;
          }
          
          setMonthlyLeavesData(leavesData);
        } catch (error) {
          console.error('Error loading monthly leaves:', error);
          setMonthlyLeavesData({});
        } finally {
          setLoadingMonthlyData(false);
        }
      }
    };
    
    loadMonthlyLeaves();
  }, [activeTab, selectedMonth, selectedYear, employees]);

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
              Manage employee leaves and balances
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="add">
              <Plus className="h-4 w-4 mr-2" />
              Add Leave
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Calendar className="h-4 w-4 mr-2" />
              Monthly Summary
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Leave History
            </TabsTrigger>
            <TabsTrigger value="balance">
              <BarChart className="h-4 w-4 mr-2" />
              Leave Balance
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Add New Leave */}
          <TabsContent value="add" className="space-y-6">
            <div className="bento-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Add New Leave Entry</h2>
                  <p className="text-sm text-muted-foreground">Record date-wise employee leaves</p>
                </div>
                <Dialog open={showAddLeaveDialog} onOpenChange={setShowAddLeaveDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Leave
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Leave Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="employee">Employee *</Label>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.name} - {emp.designation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "dd-MM-yyyy") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                captionLayout="dropdown"
                                fromYear={2020}
                                toYear={new Date().getFullYear() + 1}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>End Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "dd-MM-yyyy") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                captionLayout="dropdown"
                                fromYear={2020}
                                toYear={new Date().getFullYear() + 1}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Leave Type *</Label>
                        <Select value={leaveType} onValueChange={setLeaveType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {leaveTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Number of Days</Label>
                        <Input value={calculatedDays()} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Textarea
                          id="reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={3}
                          placeholder="Enter reason for leave..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowAddLeaveDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddLeave}>
                          Add Leave
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Click "Add Leave" to record a new leave entry. Select the employee, dates, and leave type.
                  The system will automatically calculate the number of days.
            </p>
          </div>
            </div>

            {/* Recent Leaves Added */}
            <div className="bento-card">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Recent Leave Entries</h2>
              </div>
              
              {employeeLeavesList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-semibold text-sm">Employee</th>
                        <th className="text-left p-3 font-semibold text-sm">Leave Type</th>
                        <th className="text-left p-3 font-semibold text-sm">Date</th>
                        <th className="text-center p-3 font-semibold text-sm">Days</th>
                        <th className="text-left p-3 font-semibold text-sm">Reason</th>
                        <th className="text-center p-3 font-semibold text-sm w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeLeavesList.map((leave) => {
                        const employee = employees.find(e => e.id === leave.employeeId);
                        const displayDate = leave.startDate 
                          ? new Date(leave.startDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : `${leave.month}/${leave.year}`;
                        
                        return (
                          <tr key={leave.id} className="border-b border-border hover:bg-muted/30">
                            <td className="p-3">
                              <div className="font-medium">{employee?.name || 'Unknown'}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                {leave.leaveType || 'CL'}
                              </span>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {displayDate}
                            </td>
                            <td className="p-3 text-center text-sm">
                              {leave.numberOfDays || leave.leavesTaken || 0}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground truncate max-w-xs">
                              {leave.reason || '-'}
                            </td>
                            <td className="p-3 text-center">
          <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLeave(leave.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No leave entries yet. Click "Add Leave" to create your first entry.
                  </p>
                </div>
              )}
        </div>
          </TabsContent>

          {/* Tab 2: Monthly Summary - Show leaves taken per employee */}
          <TabsContent value="monthly" className="space-y-6">

        {/* Period Selection */}
        <div className="bento-card bg-gradient-to-br from-[rgb(var(--lavander))]/10 to-[rgb(var(--sky))]/10 border-[rgb(var(--lavander))]/20">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[rgb(var(--lavander))]" />
            <h2 className="text-lg font-semibold">Select Month & Year</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Monthly Leaves Summary Table */}
        {loadingMonthlyData ? (
          <div className="bento-card animate-pulse">
            <div className="h-64 bg-muted rounded" />
          </div>
        ) : employees && employees.length > 0 && selectedMonth && selectedYear ? (
          <div className="bento-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold">Employee Name</th>
                    <th className="text-left p-4 font-semibold">Designation</th>
                    <th className="text-center p-4 font-semibold w-32">Leaves Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr 
                      key={employee.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium">{employee.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">{employee.designation}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-center">
                          <span className="text-lg font-semibold">
                            {monthlyLeavesData[employee.id] || 0}
                                </span>
                          <span className="text-sm text-muted-foreground ml-1">days</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : !selectedMonth || !selectedYear ? (
          <div className="bento-card">
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Please select a month and year to view the leave summary.
              </p>
            </div>
          </div>
        ) : (
          <div className="bento-card">
            <div className="text-center py-8">
              <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
                No employees found.
            </p>
            </div>
          </div>
        )}
      </TabsContent>

          {/* Tab 3: Leave History */}
          <TabsContent value="history" className="space-y-6">
            <div className="bento-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Leave History</h2>
                  <p className="text-sm text-muted-foreground">View detailed leave records for employees</p>
                </div>
                <div className="w-64">
                  <Select value={selectedEmployeeForHistory || "all"} onValueChange={(val) => setSelectedEmployeeForHistory(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee to view history" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {leaveHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-semibold">Employee</th>
                        <th className="text-left p-3 font-semibold">Leave Type</th>
                        <th className="text-left p-3 font-semibold">Start Date</th>
                        <th className="text-left p-3 font-semibold">End Date</th>
                        <th className="text-center p-3 font-semibold">Days</th>
                        <th className="text-left p-3 font-semibold">Reason</th>
                        <th className="text-center p-3 font-semibold w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveHistory.map((leave) => {
                        const employee = employees.find(e => e.id === leave.employeeId);
                        return (
                          <tr key={leave.id} className="border-b border-border hover:bg-muted/30">
                            <td className="p-3">{employee?.name || 'Unknown'}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                {leave.leaveType || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3">
                              {leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : `${leave.month}/${leave.year}`}
                            </td>
                            <td className="p-3">
                              {leave.endDate ? new Date(leave.endDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : '-'}
                            </td>
                            <td className="p-3 text-center">{leave.numberOfDays || leave.leavesTaken}</td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {leave.reason || '-'}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLeave(leave.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
          </div>
        ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
                    {selectedEmployeeForHistory && selectedEmployeeForHistory !== "all" 
                      ? 'No leave records found for this employee' 
                      : 'Select an employee to view leave history or select "All Employees" to see all leaves'}
            </p>
          </div>
        )}
            </div>
          </TabsContent>

          {/* Tab 4: Leave Balance */}
          <TabsContent value="balance" className="space-y-6">
            <div className="space-y-4">
              {employees.length > 0 ? (
                employees.map((emp) => {
                  const balance = leaveBalances[emp.id] || {};
                  const leaveTypes = ['CL', 'SL', 'PL', 'LWP'];
                  
                  return (
                    <div key={emp.id} className="bento-card">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                        <div>
                          <h3 className="font-semibold text-lg">{emp.name}</h3>
                          <p className="text-sm text-muted-foreground">{emp.designation}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date().getFullYear()} Allocation
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {leaveTypes.map((type) => {
                          const balanceData = balance[type] || { allocated: 0, used: 0, balance: 0 };
                          return (
                            <div key={type} className="border rounded-lg p-4 bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-muted-foreground">{type}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  balanceData.balance > 0 
                                    ? 'bg-[rgb(var(--tea))]/10 text-[rgb(var(--tea))]' 
                                    : balanceData.balance === 0 
                                    ? 'bg-muted text-muted-foreground' 
                                    : 'bg-[rgb(var(--tangerine))]/10 text-[rgb(var(--tangerine))]'
                                }`}>
                                  {balanceData.balance > 0 ? 'Active' : balanceData.balance === 0 ? 'Exhausted' : 'Exceeded'}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Allocated:</span>
                                  <span className="font-medium">{balanceData.allocated}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Used:</span>
                                  <span className="font-medium text-[rgb(var(--tangerine))]">{balanceData.used}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                                  <span className="text-muted-foreground">Balance:</span>
                                  <span className={balanceData.balance > 0 ? 'text-[rgb(var(--tea))]' : 'text-[rgb(var(--tangerine))]'}>
                                    {balanceData.balance}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bento-card text-center py-12">
                  <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No employees found. Add employees first to track leave balances.
                  </p>
          </div>
        )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}


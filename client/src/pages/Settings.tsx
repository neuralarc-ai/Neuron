import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [formData, setFormData] = useState({
    leaveQuotaPerMonth: "2",
    tdsRate: "10",
    workingDaysPerMonth: "22",
    clAllocation: "12",
    slAllocation: "12",
    plAllocation: "15",
    lwpAllocation: "0",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load default settings on component mount
  useEffect(() => {
    // For now, use default values
    // In a real implementation, you'd fetch from Supabase settings table
    setFormData({
      leaveQuotaPerMonth: "2",
      tdsRate: "10", 
      workingDaysPerMonth: "22",
      clAllocation: "12",
      slAllocation: "12",
      plAllocation: "15",
      lwpAllocation: "0",
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    try {
      // For now, just show a success message
      // In a real implementation, you'd save to Supabase settings table
      console.log('Saving settings:', {
        leaveQuotaPerMonth: parseInt(formData.leaveQuotaPerMonth),
        tdsRate: parseInt(formData.tdsRate),
        workingDaysPerMonth: parseInt(formData.workingDaysPerMonth),
      });
      
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system settings and policies</p>
        </div>

        <div className="max-w-2xl">
          <div className="bento-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[rgb(var(--lavander))]/10">
                <SettingsIcon className="h-6 w-6 text-[rgb(var(--lavander))]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Payroll Configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Manage leave quotas, tax rates, and working days
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveQuotaPerMonth">Monthly Leave Quota</Label>
                  <Input
                    id="leaveQuotaPerMonth"
                    type="number"
                    min="0"
                    value={formData.leaveQuotaPerMonth}
                    onChange={(e) =>
                      setFormData({ ...formData, leaveQuotaPerMonth: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of leaves allowed per employee per month without deduction
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tdsRate">TDS Rate (%)</Label>
                  <Input
                    id="tdsRate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.tdsRate}
                    onChange={(e) => setFormData({ ...formData, tdsRate: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Tax Deducted at Source percentage (default: 10%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingDaysPerMonth">Working Days Per Month</Label>
                  <Input
                    id="workingDaysPerMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.workingDaysPerMonth}
                    onChange={(e) =>
                      setFormData({ ...formData, workingDaysPerMonth: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to calculate pro-rata deductions for excess leaves
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </div>

          {/* Leave Type Allocations */}
          <div className="bento-card mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[rgb(var(--tea))]/10">
                <SettingsIcon className="h-6 w-6 text-[rgb(var(--tea))]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Annual Leave Allocations</h2>
                <p className="text-sm text-muted-foreground">
                  Configure yearly leave entitlements by type
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clAllocation">Casual Leave (CL) - Annual</Label>
                  <Input
                    id="clAllocation"
                    type="number"
                    min="0"
                    value={formData.clAllocation}
                    onChange={(e) =>
                      setFormData({ ...formData, clAllocation: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual allocation for casual leaves (default: 12 days)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slAllocation">Sick Leave (SL) - Annual</Label>
                  <Input
                    id="slAllocation"
                    type="number"
                    min="0"
                    value={formData.slAllocation}
                    onChange={(e) =>
                      setFormData({ ...formData, slAllocation: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual allocation for sick leaves (default: 12 days)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plAllocation">Privilege Leave (PL) - Annual</Label>
                  <Input
                    id="plAllocation"
                    type="number"
                    min="0"
                    value={formData.plAllocation}
                    onChange={(e) =>
                      setFormData({ ...formData, plAllocation: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual allocation for privilege/earned leaves (default: 15 days)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lwpAllocation">Leave Without Pay (LWP)</Label>
                  <Input
                    id="lwpAllocation"
                    type="number"
                    min="0"
                    value={formData.lwpAllocation}
                    onChange={(e) =>
                      setFormData({ ...formData, lwpAllocation: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Unlimited (leave without salary)
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Leave Allocations"}
                </Button>
              </div>
            </form>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bento-card bg-[rgb(var(--sky))]/10 border-[rgb(var(--sky))]/20">
              <h3 className="font-semibold mb-2">Salary Calculation</h3>
              <p className="text-sm text-muted-foreground">
                Net Salary = Gross Salary - TDS - Leave Deductions
              </p>
            </div>
            <div className="bento-card bg-[rgb(var(--pink-quartz))]/10 border-[rgb(var(--pink-quartz))]/20">
              <h3 className="font-semibold mb-2">Leave Deduction</h3>
              <p className="text-sm text-muted-foreground">
                (Salary / Working Days) × Excess Leaves
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


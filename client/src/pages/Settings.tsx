import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  
  const [formData, setFormData] = useState({
    leaveQuotaPerMonth: "",
    tdsRate: "",
    workingDaysPerMonth: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        leaveQuotaPerMonth: settings.leaveQuotaPerMonth.toString(),
        tdsRate: settings.tdsRate.toString(),
        workingDaysPerMonth: settings.workingDaysPerMonth.toString(),
      });
    }
  }, [settings]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Settings updated successfully");
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateMutation.mutate({
      leaveQuotaPerMonth: parseInt(formData.leaveQuotaPerMonth),
      tdsRate: parseInt(formData.tdsRate),
      workingDaysPerMonth: parseInt(formData.workingDaysPerMonth),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <div className="bento-card animate-pulse">
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
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


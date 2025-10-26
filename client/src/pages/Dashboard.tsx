import { useState, useEffect } from "react";
import { Users, DollarSign, TrendingUp, Calendar, FileText } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api, DashboardStats } from "@/lib/supabase";
import { useLocation } from "wouter";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: string;
}) {
  return (
    <div className="bento-card">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome to Neuron</p>
            </div>
            <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bento-card animate-pulse">
                  <div className="h-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your HR management system</p>
        </div>

        {/* Stats Grid */}
        <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={Users}
            color="bg-[rgb(var(--lavander))]"
          />
          <StatCard
            title="Active Employees"
            value={stats?.activeEmployees || 0}
            icon={TrendingUp}
            color="bg-[rgb(var(--tea))]"
          />
          <StatCard
            title="Inactive Employees"
            value={stats?.inactiveEmployees || 0}
            icon={Calendar}
            color="bg-[rgb(var(--tangerine))]"
          />
          <StatCard
            title="Monthly Payroll"
            value={formatCurrency(stats?.monthlyPayroll || 0)}
            icon={DollarSign}
            color="bg-[rgb(var(--mustard))]"
          />
        </div>

        {/* Welcome Card */}
        <div className="bento-card bg-gradient-to-br from-[rgb(var(--lavander))]/10 to-[rgb(var(--sky))]/10 border-[rgb(var(--lavander))]/20">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Welcome to Neuron</h2>
            <p className="text-muted-foreground max-w-2xl">
              Manage your employees, track leaves, process payroll, and generate payslips all in one place. 
              Navigate through the sidebar to access different modules.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[rgb(var(--lavander))]" />
                <span className="text-sm">Employee Management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[rgb(var(--tea))]" />
                <span className="text-sm">Leave Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[rgb(var(--mustard))]" />
                <span className="text-sm">Payroll Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[rgb(var(--tangerine))]" />
                <span className="text-sm">Payslip Generation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bento-grid grid-cols-1 md:grid-cols-3">
          <div 
            className="bento-card hover:border-[rgb(var(--lavander))]/50 cursor-pointer transition-all group"
            onClick={() => setLocation("/employees")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[rgb(var(--lavander))]/10 group-hover:bg-[rgb(var(--lavander))]/20 transition-colors">
                <Users className="h-5 w-5 text-[rgb(var(--lavander))]" />
              </div>
              <h3 className="font-semibold text-lg">Manage Employees</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Add, edit, or remove employee records
            </p>
          </div>
          <div 
            className="bento-card hover:border-[rgb(var(--tea))]/50 cursor-pointer transition-all group"
            onClick={() => setLocation("/leaves")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[rgb(var(--tea))]/10 group-hover:bg-[rgb(var(--tea))]/20 transition-colors">
                <Calendar className="h-5 w-5 text-[rgb(var(--tea))]" />
              </div>
              <h3 className="font-semibold text-lg">Track Leaves</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor employee leave records and quotas
            </p>
          </div>
          <div 
            className="bento-card hover:border-[rgb(var(--mustard))]/50 cursor-pointer transition-all group"
            onClick={() => setLocation("/payroll")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[rgb(var(--mustard))]/10 group-hover:bg-[rgb(var(--mustard))]/20 transition-colors">
                <FileText className="h-5 w-5 text-[rgb(var(--mustard))]" />
              </div>
              <h3 className="font-semibold text-lg">Generate Payment Advice</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Create monthly payslips for all employees
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


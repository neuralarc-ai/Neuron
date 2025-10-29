import DashboardLayout from "@/components/DashboardLayout";
import { TransactionForm } from "@/components/TransactionForm";
import { AccountingDashboard } from "@/components/AccountingDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart } from "lucide-react";

export default function Revenue() {
  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue</h1>
          <p className="text-muted-foreground mt-1">
            Track revenue sources and manage accounting transactions
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">
              <BarChart className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="create">
              <FileText className="h-4 w-4 mr-2" />
              Create Transaction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AccountingDashboard />
          </TabsContent>

          <TabsContent value="create">
            <TransactionForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}


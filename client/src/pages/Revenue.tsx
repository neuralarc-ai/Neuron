import DashboardLayout from "@/components/DashboardLayout";
import { SimpleRevenueForm } from "@/components/SimpleRevenueForm";
import { TransactionForm } from "@/components/TransactionForm";
import { AccountingDashboard } from "@/components/AccountingDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart, DollarSign } from "lucide-react";

export default function Revenue() {
  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue & Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track your income and expenses easily
          </p>
        </div>

        <Tabs defaultValue="simple" className="space-y-6">
          <TabsList>
            <TabsTrigger value="simple">
              <DollarSign className="h-4 w-4 mr-2" />
              Quick Entry
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <FileText className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simple">
            <SimpleRevenueForm />
          </TabsContent>

          <TabsContent value="dashboard">
            <AccountingDashboard />
          </TabsContent>

          <TabsContent value="advanced">
            <TransactionForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}


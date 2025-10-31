import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrendingUp, DollarSign, Calendar, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export function AccountingDashboard() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const { data: summary, isLoading } = trpc.accounting.getSummary.useQuery({
    month,
    year,
  });

  // Fetch all transactions (both draft and posted) for display
  const utils = trpc.useUtils();

  const { data: recentTransactions, refetch: refetchTransactions } = trpc.accounting.getTransactions.useQuery({
    limit: 50, // Increase limit to show more transactions
    // Remove status filter to show both draft and posted
  });

  // Refetch transactions when component mounts or when month/year changes
  const { refetch: refetchSummary } = trpc.accounting.getSummary.useQuery({
    month,
    year,
  });

  const deleteTransaction = trpc.accounting.deleteTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transaction deleted successfully");
      utils.accounting.getTransactions.invalidate();
      utils.accounting.getSummary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete transaction");
    },
  });

  const handleDelete = (transactionId: number) => {
    deleteTransaction.mutate({ transactionId });
  };

  // Refetch when month or year changes
  useEffect(() => {
    refetchTransactions();
    refetchSummary();
  }, [month, year, refetchTransactions, refetchSummary]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Accounting Dashboard</h2>
          <p className="text-muted-foreground">View revenue and expense summary</p>
        </div>
        <div className="flex gap-2">
          <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Posted transactions this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary?.totalAmount?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Total transaction value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.topCategories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Highest spending categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.topCategories && summary.topCategories.length > 0 ? (
              <div className="space-y-4">
                {summary.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="font-semibold">₹{category.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transactions this month</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest transactions (draft and posted)</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.slice(0, 5).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {transaction.description || transaction.transaction_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">₹{transaction.total_amount?.toFixed(2) || "0.00"}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the transaction "{transaction.description || transaction.transaction_number}" 
                              and all its entries. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Entries</CardTitle>
          <CardDescription>Detailed view of all transaction entries with debit and credit</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-6">
              {recentTransactions.map((transaction: any) => (
                <div key={transaction.id} className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {transaction.description || transaction.transaction_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)} • {transaction.reference || "No reference"}
                        {transaction.status && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            transaction.status === "posted" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}>
                            {transaction.status}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">₹{transaction.total_amount?.toFixed(2) || "0.00"}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the transaction "{transaction.description || transaction.transaction_number}" 
                              and all its entries. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {transaction.entries && transaction.entries.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transaction.entries.map((entry: any) => {
                          const debitValue = entry.debit != null ? parseFloat(String(entry.debit)) : 0;
                          const creditValue = entry.credit != null ? parseFloat(String(entry.credit)) : 0;
                          const accountDisplay = entry.account 
                            ? `${entry.account.code} - ${entry.account.name}`
                            : entry.account_id 
                            ? `Account ID: ${entry.account_id}`
                            : "N/A";
                          return (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                {accountDisplay}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {entry.description || "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {debitValue > 0 ? `₹${debitValue.toFixed(2)}` : "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {creditValue > 0 ? `₹${creditValue.toFixed(2)}` : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No entries found for this transaction</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No transactions found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


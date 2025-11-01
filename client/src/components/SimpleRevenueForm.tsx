import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowUpCircle, ArrowDownCircle, Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";

type TransactionType = "revenue" | "expense";

interface TableRowData {
  id: string;
  date: string;
  selectedDate: Date | undefined;
  description: string;
  reference: string;
  amount: string;
  accountId: number;
  categoryId?: number;
  vendorId?: number;
}

export function SimpleRevenueForm() {
  const [transactionType, setTransactionType] = useState<TransactionType>("revenue");
  const [rows, setRows] = useState<TableRowData[]>([
    {
      id: `row-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      selectedDate: new Date(),
      description: "",
      reference: "",
      amount: "",
      accountId: 0,
      categoryId: undefined,
      vendorId: undefined,
    },
  ]);

  const { data: accounts, isLoading: accountsLoading } = trpc.accounting.getAccounts.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.accounting.getCategories.useQuery();
  const { data: vendors, isLoading: vendorsLoading } = trpc.accounting.getVendors.useQuery();

  // Get accounts filtered by type based on transaction type
  const relevantAccounts = accounts?.filter((account) => {
    if (transactionType === "revenue") {
      // For revenue, show revenue accounts (where money goes TO) and asset accounts (where money comes FROM like bank)
      return account.type === "revenue" || account.type === "asset";
    } else {
      // For expense, show expense accounts (where money goes TO) and asset accounts (where money comes FROM like bank)
      return account.type === "expense" || account.type === "asset";
    }
  });

  const utils = trpc.useUtils();

  const createTransaction = trpc.accounting.createTransaction.useMutation({
    onSuccess: () => {
      toast.success(`${transactionType === "revenue" ? "Revenue" : "Expense"} recorded successfully!`);
      // Invalidate and refetch transactions and summary
      utils.accounting.getTransactions.invalidate();
      utils.accounting.getSummary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transaction");
    },
  });

  const addRow = () => {
    const today = new Date();
    setRows([
      ...rows,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        date: today.toISOString().split("T")[0],
        selectedDate: today,
        description: "",
        reference: "",
        amount: "",
        accountId: 0,
        categoryId: undefined,
        vendorId: undefined,
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    } else {
      toast.error("At least one row is required");
    }
  };

  const updateRow = (id: string, field: keyof TableRowData, value: any) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find a cash/bank account for the balancing entry
    const cashAccount = accounts?.find(
      (acc) => acc.type === "asset" && (acc.name.toLowerCase().includes("cash") || acc.name.toLowerCase().includes("bank"))
    );

    if (!cashAccount) {
      toast.error("No cash/bank account found. Please create a cash or bank account first.");
      return;
    }

    // Validate all rows
    const validRows = rows.filter((row) => {
      if (!row.accountId || row.accountId === 0) {
        return false;
      }
      const amountValue = parseFloat(row.amount);
      return !isNaN(amountValue) && amountValue > 0;
    });

    if (validRows.length === 0) {
      toast.error("Please fill in at least one complete row");
      return;
    }

    if (validRows.length !== rows.length) {
      toast.error("Some rows are incomplete. Please fill all required fields.");
      return;
    }

    // Create transactions for each valid row
    const transactionPromises = validRows.map((row) => {
      const amountValue = parseFloat(row.amount);
      const entries = [];

      if (transactionType === "revenue") {
        // Revenue: Debit cash, Credit revenue account
        // Category should only be on the revenue account entry (credit side), not the cash entry
        entries.push({
          accountId: cashAccount.id,
          categoryId: undefined, // No category for cash/bank account entries
          vendorId: row.vendorId,
          description: row.description || "Revenue Entry",
          debit: amountValue,
          credit: 0,
        });
        entries.push({
          accountId: row.accountId,
          categoryId: row.categoryId, // Category assigned to revenue account entry
          vendorId: row.vendorId,
          description: row.description || "Revenue Entry",
          debit: 0,
          credit: amountValue,
        });
      } else {
        // Expense: Debit expense account, Credit cash
        // Category should only be on the expense account entry (debit side), not the cash entry
        entries.push({
          accountId: row.accountId,
          categoryId: row.categoryId, // Category assigned to expense account entry
          vendorId: row.vendorId,
          description: row.description || "Expense Entry",
          debit: amountValue,
          credit: 0,
        });
        entries.push({
          accountId: cashAccount.id,
          categoryId: undefined, // No category for cash/bank account entries
          vendorId: row.vendorId,
          description: row.description || "Expense Entry",
          debit: 0,
          credit: amountValue,
        });
      }

      return createTransaction.mutateAsync({
        date: row.date,
        description: row.description || (transactionType === "revenue" ? "Revenue Entry" : "Expense Entry"),
        reference: row.reference,
        status: "posted",
        entries,
      });
    });

    try {
      await Promise.all(transactionPromises);
      toast.success(`${validRows.length} ${transactionType === "revenue" ? "revenue" : "expense"} transaction(s) created successfully!`);
      // Reset to one empty row
      const today = new Date();
      setRows([
        {
          id: `row-${Date.now()}`,
          date: today.toISOString().split("T")[0],
          selectedDate: today,
          description: "",
          reference: "",
          amount: "",
          accountId: 0,
          categoryId: undefined,
          vendorId: undefined,
        },
      ]);
    } catch (error) {
      // Error already handled in mutation
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {transactionType === "revenue" ? "Record Revenue" : "Record Expense"}
            </CardTitle>
            <CardDescription>
              {transactionType === "revenue"
                ? "Record money coming in (sales, income, etc.)"
                : "Record money going out (costs, bills, etc.)"}
            </CardDescription>
          </div>
          <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as TransactionType)}>
            <TabsList>
              <TabsTrigger value="revenue">
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="expense">
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Expense
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Quick Entry Table</Label>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date *</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[200px]">
                    {transactionType === "revenue" ? "Revenue Account *" : "Expense Account *"}
                  </TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                  <TableHead className="w-[150px]">Vendor</TableHead>
                  <TableHead className="w-[150px]">Reference</TableHead>
                  <TableHead className="w-[120px]">Amount (₹) *</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            className={`w-full justify-start text-left font-normal text-xs h-9 ${!row.selectedDate && "text-muted-foreground"}`}
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {row.selectedDate ? formatDate(row.selectedDate) : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={row.selectedDate}
                            onSelect={(date) => {
                              updateRow(row.id, "selectedDate", date);
                              if (date) {
                                updateRow(row.id, "date", format(date, "yyyy-MM-dd"));
                              }
                            }}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={new Date().getFullYear() + 1}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateRow(row.id, "description", e.target.value)}
                        placeholder={transactionType === "revenue" ? "Product Sale..." : "Office Supplies..."}
                        className="h-9 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.accountId > 0 ? row.accountId.toString() : undefined}
                        onValueChange={(value) => updateRow(row.id, "accountId", parseInt(value))}
                        disabled={accountsLoading}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {relevantAccounts && relevantAccounts.length > 0 ? (
                            relevantAccounts
                              .filter((acc) => acc.type === (transactionType === "revenue" ? "revenue" : "expense"))
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.code} - {account.name}
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="none" disabled>No accounts</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.categoryId ? row.categoryId.toString() : undefined}
                        onValueChange={(value) => updateRow(row.id, "categoryId", value ? parseInt(value) : undefined)}
                        disabled={categoriesLoading}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories && categories.length > 0 ? (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No categories</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.vendorId ? row.vendorId.toString() : undefined}
                        onValueChange={(value) => updateRow(row.id, "vendorId", value ? parseInt(value) : undefined)}
                        disabled={vendorsLoading}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors && vendors.length > 0 ? (
                            vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                {vendor.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No vendors</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={row.reference}
                        onChange={(e) => updateRow(row.id, "reference", e.target.value)}
                        placeholder="Invoice #..."
                        className="h-9 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          if (value === "" || !isNaN(parseFloat(value))) {
                            updateRow(row.id, "amount", value);
                          }
                        }}
                        placeholder="0.00"
                        className="h-9 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      {rows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {transactionType === "revenue"
                ? "Each row will automatically debit cash/bank and credit the revenue account."
                : "Each row will automatically debit the expense account and credit cash/bank."}
            </p>
            <Button type="submit" disabled={createTransaction.isPending || rows.length === 0} className="min-w-[150px]">
              {createTransaction.isPending
                ? "Recording..."
                : transactionType === "revenue"
                ? `Record ${rows.length} Revenue`
                : `Record ${rows.length} Expense`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


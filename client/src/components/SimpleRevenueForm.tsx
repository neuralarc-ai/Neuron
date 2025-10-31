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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpCircle, ArrowDownCircle, Calendar as CalendarIcon, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";

type TransactionType = "revenue" | "expense";

interface SimpleTransaction {
  type: TransactionType;
  date: string;
  description: string;
  reference: string;
  amount: string;
  accountId: number;
  categoryId?: number;
  vendorId?: number;
  notes?: string;
}

export function SimpleRevenueForm() {
  const [transactionType, setTransactionType] = useState<TransactionType>("revenue");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [vendorId, setVendorId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");

  const utils = trpc.useUtils();
  const { data: accounts, isLoading: accountsLoading } = trpc.accounting.getAccounts.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.accounting.getCategories.useQuery();
  const { data: vendors, isLoading: vendorsLoading } = trpc.accounting.getVendors.useQuery();

  const createVendor = trpc.accounting.createVendor.useMutation({
    onSuccess: (data) => {
      toast.success("Vendor created successfully");
      setShowAddVendor(false);
      setNewVendorName("");
      setNewVendorEmail("");
      setNewVendorPhone("");
      utils.accounting.getVendors.invalidate();
      if (data.vendor) {
        setVendorId(data.vendor.id);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create vendor");
    },
  });

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

  const createTransaction = trpc.accounting.createTransaction.useMutation({
    onSuccess: () => {
      toast.success(`${transactionType === "revenue" ? "Revenue" : "Expense"} recorded successfully!`);
      // Invalidate and refetch transactions and summary
      utils.accounting.getTransactions.invalidate();
      utils.accounting.getSummary.invalidate();
      // Reset form
      const today = new Date();
      setSelectedDate(today);
      setDate(today.toISOString().split("T")[0]);
      setDescription("");
      setReference("");
      setAmount("");
      setAccountId(0);
      setCategoryId(undefined);
      setVendorId(undefined);
      setNotes("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transaction");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId || accountId === 0) {
      toast.error(`Please select a ${transactionType === "revenue" ? "revenue" : "expense"} account`);
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Find a cash/bank account for the balancing entry
    const cashAccount = accounts?.find(
      (acc) => acc.type === "asset" && (acc.name.toLowerCase().includes("cash") || acc.name.toLowerCase().includes("bank"))
    );

    if (!cashAccount) {
      toast.error("No cash/bank account found. Please create a cash or bank account first.");
      return;
    }

    // Create double-entry transactions automatically
    const entries = [];

    if (transactionType === "revenue") {
      // Revenue: Debit cash, Credit revenue account
      entries.push({
        accountId: cashAccount.id,
        categoryId: categoryId,
        vendorId: vendorId,
        description: notes || description,
        debit: amountValue,
        credit: 0,
      });
      entries.push({
        accountId: accountId,
        categoryId: categoryId,
        vendorId: vendorId,
        description: notes || description,
        debit: 0,
        credit: amountValue,
      });
    } else {
      // Expense: Debit expense account, Credit cash
      entries.push({
        accountId: accountId,
        categoryId: categoryId,
        vendorId: vendorId,
        description: notes || description,
        debit: amountValue,
        credit: 0,
      });
      entries.push({
        accountId: cashAccount.id,
        categoryId: categoryId,
        vendorId: vendorId,
        description: notes || description,
        debit: 0,
        credit: amountValue,
      });
    }

    createTransaction.mutate({
      date,
      description: description || (transactionType === "revenue" ? "Revenue Entry" : "Expense Entry"),
      reference,
      status: "posted",
      entries,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {transactionType === "revenue" ? "Record Revenue" : "Record Expense"}
        </CardTitle>
        <CardDescription>
          {transactionType === "revenue"
            ? "Record money coming in (sales, income, etc.)"
            : "Record money going out (costs, bills, etc.)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as TransactionType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="revenue">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Revenue (Money In)
            </TabsTrigger>
            <TabsTrigger value="expense">
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Expense (Money Out)
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={`w-full justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? formatDate(selectedDate) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setDate(format(date, "yyyy-MM-dd"));
                      }
                    }}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear() + 1}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  if (value === "" || !isNaN(parseFloat(value))) {
                    setAmount(value);
                  }
                }}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {transactionType === "revenue" ? "Source (e.g., Product Sale, Service Fee)" : "Item (e.g., Office Supplies, Utilities)"}
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={transactionType === "revenue" ? "What is this revenue from?" : "What is this expense for?"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">
                {transactionType === "revenue" ? "Revenue Account *" : "Expense Account *"}
              </Label>
              <Select
                value={accountId > 0 ? accountId.toString() : undefined}
                onValueChange={(value) => setAccountId(parseInt(value))}
                disabled={accountsLoading}
                required
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder={accountsLoading ? "Loading..." : `Select ${transactionType === "revenue" ? "revenue" : "expense"} account`} />
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
                    <SelectItem value="none" disabled>No accounts available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId ? categoryId.toString() : undefined}
                onValueChange={(value) => setCategoryId(value ? parseInt(value) : undefined)}
                disabled={categoriesLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No categories available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Invoice #, Receipt #, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">{transactionType === "revenue" ? "Customer/Vendor" : "Vendor"}</Label>
              <div className="flex gap-2">
                <Select
                  value={vendorId ? vendorId.toString() : undefined}
                  onValueChange={(value) => setVendorId(value ? parseInt(value) : undefined)}
                  disabled={vendorsLoading}
                >
                  <SelectTrigger id="vendor" className="flex-1">
                    <SelectValue placeholder={vendorsLoading ? "Loading..." : "Select (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors && vendors.length > 0 ? (
                      vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No vendors available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddVendor(true)}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Amount:</span>
              <span className="font-semibold text-lg">
                {amount ? `₹${parseFloat(amount).toFixed(2)}` : "₹0.00"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {transactionType === "revenue"
                ? "This will automatically debit your cash/bank account and credit the revenue account."
                : "This will automatically debit the expense account and credit your cash/bank account."}
            </p>
          </div>

          <Button type="submit" disabled={createTransaction.isPending || !accountId || !amount} className="w-full">
            {createTransaction.isPending
              ? "Recording..."
              : transactionType === "revenue"
              ? "Record Revenue"
              : "Record Expense"}
          </Button>
        </form>

        {/* Add Vendor Dialog */}
        <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorEmail">Email</Label>
                <Input
                  id="vendorEmail"
                  type="email"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorPhone">Phone</Label>
                <Input
                  id="vendorPhone"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  placeholder="+91 1234567890"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddVendor(false);
                    setNewVendorName("");
                    setNewVendorEmail("");
                    setNewVendorPhone("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!newVendorName.trim()) {
                      toast.error("Vendor name is required");
                      return;
                    }
                    createVendor.mutate({
                      name: newVendorName.trim(),
                      email: newVendorEmail.trim() || undefined,
                      phone: newVendorPhone.trim() || undefined,
                    });
                  }}
                  disabled={createVendor.isPending || !newVendorName.trim()}
                >
                  {createVendor.isPending ? "Creating..." : "Create Vendor"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}


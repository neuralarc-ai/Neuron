import { useState, useEffect } from "react";
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
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";

interface Entry {
  accountId: number;
  categoryId?: number;
  vendorId?: number;
  description: string;
  debit: number;
  credit: number;
  debitInput?: string; // String value for input display
  creditInput?: string; // String value for input display
}

export function TransactionForm() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState<"draft" | "posted">("draft");
  const [entries, setEntries] = useState<Entry[]>([
    { accountId: 0, description: "", debit: 0, credit: 0, debitInput: "", creditInput: "" },
  ]);

  const { data: accounts, isLoading: accountsLoading, error: accountsError } = trpc.accounting.getAccounts.useQuery();
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = trpc.accounting.getCategories.useQuery();
  // Make vendors query optional with error handling - don't block form if it fails
  const { data: vendors, isLoading: vendorsLoading, error: vendorsError } = trpc.accounting.getVendors.useQuery(
    undefined,
    {
      retry: 1, // Only retry once
      retryDelay: 1000,
      staleTime: 30000, // Cache for 30 seconds
      onError: (error) => {
        console.error("[TransactionForm] Vendors query failed (non-blocking):", error);
        // Don't show toast - vendors are optional
      },
    }
  );

  // Log errors and data for debugging
  useEffect(() => {
    if (accountsError) {
      console.error("[TransactionForm] Accounts query error:", accountsError);
    }
    if (categoriesError) {
      console.error("[TransactionForm] Categories query error:", categoriesError);
    }
    if (vendorsError) {
      console.error("[TransactionForm] Vendors query error:", vendorsError);
    }
    
    // Log data when it's loaded
    if (accounts) {
      console.log("[TransactionForm] Accounts loaded:", accounts.length, accounts);
    }
    if (categories) {
      console.log("[TransactionForm] Categories loaded:", categories.length, categories);
    }
    if (vendors) {
      console.log("[TransactionForm] Vendors loaded:", vendors.length, vendors);
    }
  }, [accounts, categories, vendors, accountsError, categoriesError, vendorsError]);

  const utils = trpc.useUtils();
  
  const createTransaction = trpc.accounting.createTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transaction created successfully");
      // Invalidate and refetch transactions and summary
      utils.accounting.getTransactions.invalidate();
      utils.accounting.getSummary.invalidate();
      // Reset form
      const today = new Date();
      setSelectedDate(today);
      setDate(today.toISOString().split("T")[0]);
      setDescription("");
      setReference("");
      setStatus("draft");
      setEntries([{ accountId: 0, description: "", debit: 0, credit: 0, debitInput: "", creditInput: "" }]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transaction");
    },
  });

  const addEntry = () => {
    setEntries([...entries, { accountId: 0, description: "", debit: 0, credit: 0, debitInput: "", creditInput: "" }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof Entry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Normalize entries - ensure numeric values are set from input strings
    const normalizedEntries = entries.map((entry) => {
      let debit = entry.debit || 0;
      let credit = entry.credit || 0;

      // If there's an input string, parse it and use that value
      if (entry.debitInput && entry.debitInput.trim() !== "") {
        const parsed = parseFloat(entry.debitInput);
        if (!isNaN(parsed) && parsed > 0) {
          debit = parsed;
          credit = 0;
        }
      }

      if (entry.creditInput && entry.creditInput.trim() !== "") {
        const parsed = parseFloat(entry.creditInput);
        if (!isNaN(parsed) && parsed > 0) {
          credit = parsed;
          debit = 0;
        }
      }

      return {
        ...entry,
        debit,
        credit,
      };
    });

    // Validate entries
    const totalDebit = normalizedEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = normalizedEntries.reduce((sum, e) => sum + e.credit, 0);

    if (totalDebit !== totalCredit) {
      toast.error(`Transaction unbalanced: Debit (${totalDebit}) ≠ Credit (${totalCredit})`);
      return;
    }

    if (normalizedEntries.some((e) => !e.accountId || e.accountId === 0)) {
      toast.error("Please select an account for all entries");
      return;
    }

    // Validate each entry has either debit or credit
    const invalidEntries = normalizedEntries.filter((e) => e.debit === 0 && e.credit === 0);
    if (invalidEntries.length > 0) {
      toast.error("Each entry must have either a debit or credit amount");
      return;
    }

    // Validate no entry has both debit and credit
    const doubleEntries = normalizedEntries.filter((e) => e.debit > 0 && e.credit > 0);
    if (doubleEntries.length > 0) {
      toast.error("Each entry can only have either debit or credit, not both");
      return;
    }

    createTransaction.mutate({
      date,
      description,
      reference,
      status,
      entries: normalizedEntries.map((e) => ({
        accountId: e.accountId,
        categoryId: e.categoryId,
        vendorId: e.vendorId,
        description: e.description,
        debit: e.debit || 0,
        credit: e.credit || 0,
      })),
    });
  };

  // Calculate totals including parsed input values for display
  const calculateTotals = () => {
    return entries.reduce(
      (acc, entry) => {
        let debit = 0;
        let credit = 0;

        // Check input strings first (most recent user input)
        if (entry.debitInput && entry.debitInput.trim() !== "") {
          const parsed = parseFloat(entry.debitInput);
          if (!isNaN(parsed) && parsed >= 0) {
            debit = parsed;
          }
        } else if (entry.debit && entry.debit > 0) {
          debit = entry.debit;
        }

        if (entry.creditInput && entry.creditInput.trim() !== "") {
          const parsed = parseFloat(entry.creditInput);
          if (!isNaN(parsed) && parsed >= 0) {
            credit = parsed;
          }
        } else if (entry.credit && entry.credit > 0) {
          credit = entry.credit;
        }

        return {
          totalDebit: acc.totalDebit + debit,
          totalCredit: acc.totalCredit + credit,
        };
      },
      { totalDebit: 0, totalCredit: 0 }
    );
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = totalDebit === totalCredit;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Transaction</CardTitle>
        <CardDescription>
          Create a new accounting transaction with double-entry bookkeeping
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label>Status *</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as "draft" | "posted")}
              >
                <SelectTrigger id="status" aria-label="Transaction status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Transaction description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Reference number or code"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label>Entries</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Double-entry requires at least 2 entries with matching debit and credit totals
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {entries.map((entry, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">Entry {index + 1}</h4>
                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEntry(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account *</Label>
                    <Select
                      value={entry.accountId && entry.accountId > 0 ? entry.accountId.toString() : undefined}
                      onValueChange={(value) =>
                        updateEntry(index, "accountId", parseInt(value) || 0)
                      }
                      disabled={accountsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={accountsLoading ? "Loading..." : "Select account"} />
                      </SelectTrigger>
                      <SelectContent>
                        {accountsLoading ? (
                          <SelectItem value="loading" disabled>Loading accounts...</SelectItem>
                        ) : accounts && accounts.length > 0 ? (
                          accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-accounts" disabled>No accounts available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={entry.categoryId && entry.categoryId > 0 ? entry.categoryId.toString() : undefined}
                      onValueChange={(value) =>
                        updateEntry(index, "categoryId", value ? parseInt(value) : undefined)
                      }
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                        ) : categories && categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={entry.description}
                      onChange={(e) => updateEntry(index, "description", e.target.value)}
                      placeholder="Entry description (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Select
                      value={entry.vendorId && entry.vendorId > 0 ? entry.vendorId.toString() : undefined}
                      onValueChange={(value) =>
                        updateEntry(index, "vendorId", value ? parseInt(value) : undefined)
                      }
                      disabled={vendorsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={vendorsLoading ? "Loading..." : "Select vendor (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorsLoading ? (
                          <SelectItem value="loading" disabled>Loading vendors...</SelectItem>
                        ) : vendors && vendors.length > 0 ? (
                          vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id.toString()}>
                              {vendor.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-vendors" disabled>No vendors available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Debit</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={entry.debitInput ?? ""}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        const newEntries = [...entries];
                        const currentEntry = { ...newEntries[index] };
                        
                        // Always update the input string to allow free typing
                        currentEntry.debitInput = inputValue;
                        
                        // Try to parse the value for numeric calculations
                        const val = parseFloat(inputValue);
                        if (inputValue === "") {
                          currentEntry.debit = 0;
                        } else if (!isNaN(val) && val >= 0) {
                          currentEntry.debit = val;
                          // Clear credit if debit has a positive value
                          if (val > 0) {
                            currentEntry.credit = 0;
                            currentEntry.creditInput = "";
                          }
                        }
                        
                        newEntries[index] = currentEntry;
                        setEntries(newEntries);
                      }}
                      onBlur={(e) => {
                        const inputValue = e.target.value.trim();
                        const val = parseFloat(inputValue);
                        const newEntries = [...entries];
                        const currentEntry = { ...newEntries[index] };
                        
                        if (inputValue === "" || isNaN(val) || val === 0) {
                          currentEntry.debit = 0;
                          currentEntry.debitInput = "";
                        } else if (val > 0) {
                          currentEntry.debit = val;
                          currentEntry.debitInput = String(val);
                          currentEntry.credit = 0;
                          currentEntry.creditInput = "";
                        }
                        
                        newEntries[index] = currentEntry;
                        setEntries(newEntries);
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credit</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={entry.creditInput ?? ""}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        const newEntries = [...entries];
                        const currentEntry = { ...newEntries[index] };
                        
                        // Always update the input string to allow free typing
                        currentEntry.creditInput = inputValue;
                        
                        // Try to parse the value for numeric calculations
                        const val = parseFloat(inputValue);
                        if (inputValue === "") {
                          currentEntry.credit = 0;
                        } else if (!isNaN(val) && val >= 0) {
                          currentEntry.credit = val;
                          // Clear debit if credit has a positive value
                          if (val > 0) {
                            currentEntry.debit = 0;
                            currentEntry.debitInput = "";
                          }
                        }
                        
                        newEntries[index] = currentEntry;
                        setEntries(newEntries);
                      }}
                      onBlur={(e) => {
                        const inputValue = e.target.value.trim();
                        const val = parseFloat(inputValue);
                        const newEntries = [...entries];
                        const currentEntry = { ...newEntries[index] };
                        
                        if (inputValue === "" || isNaN(val) || val === 0) {
                          currentEntry.credit = 0;
                          currentEntry.creditInput = "";
                        } else if (val > 0) {
                          currentEntry.credit = val;
                          currentEntry.creditInput = String(val);
                          currentEntry.debit = 0;
                          currentEntry.debitInput = "";
                        }
                        
                        newEntries[index] = currentEntry;
                        setEntries(newEntries);
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Total Debit:</span>
              <span className={isBalanced ? "text-green-600" : "text-red-600"}>
                ₹{totalDebit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Total Credit:</span>
              <span className={isBalanced ? "text-green-600" : "text-red-600"}>
                ₹{totalCredit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Balance:</span>
              <span
                className={
                  isBalanced
                    ? "text-green-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
              >
                {isBalanced ? "✓ Balanced" : `Unbalanced (₹${Math.abs(totalDebit - totalCredit).toFixed(2)})`}
              </span>
            </div>
          </div>

          <Button type="submit" disabled={!isBalanced || createTransaction.isPending} className="w-full">
            {createTransaction.isPending ? "Creating..." : "Create Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


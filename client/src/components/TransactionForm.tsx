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
import { Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Entry {
  accountId: number;
  categoryId?: number;
  vendorId?: number;
  description: string;
  debit: number;
  credit: number;
}

export function TransactionForm() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState<"draft" | "posted">("draft");
  const [entries, setEntries] = useState<Entry[]>([
    { accountId: 0, description: "", debit: 0, credit: 0 },
  ]);

  const { data: accounts } = trpc.accounting.getAccounts.useQuery();
  const { data: categories } = trpc.accounting.getCategories.useQuery();
  const { data: vendors } = trpc.accounting.getVendors.useQuery();

  const createTransaction = trpc.accounting.createTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transaction created successfully");
      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setReference("");
      setStatus("draft");
      setEntries([{ accountId: 0, description: "", debit: 0, credit: 0 }]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transaction");
    },
  });

  const addEntry = () => {
    setEntries([...entries, { accountId: 0, description: "", debit: 0, credit: 0 }]);
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

    // Validate entries
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    if (totalDebit !== totalCredit) {
      toast.error(`Transaction unbalanced: Debit (${totalDebit}) ≠ Credit (${totalCredit})`);
      return;
    }

    if (entries.some((e) => !e.accountId || e.accountId === 0)) {
      toast.error("Please select an account for all entries");
      return;
    }

    createTransaction.mutate({
      date,
      description,
      reference,
      status,
      entries: entries.map((e) => ({
        accountId: e.accountId,
        categoryId: e.categoryId,
        vendorId: e.vendorId,
        description: e.description,
        debit: e.debit || 0,
        credit: e.credit || 0,
      })),
    });
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
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
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as "draft" | "posted")}
              >
                <SelectTrigger>
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
              <Label>Entries</Label>
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
                      value={entry.accountId?.toString() || ""}
                      onValueChange={(value) =>
                        updateEntry(index, "accountId", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={entry.categoryId?.toString() || ""}
                      onValueChange={(value) =>
                        updateEntry(index, "categoryId", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
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
                      placeholder="Entry description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Debit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.debit || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateEntry(index, "debit", val);
                          updateEntry(index, "credit", 0);
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.credit || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateEntry(index, "credit", val);
                          updateEntry(index, "debit", 0);
                        }}
                        placeholder="0.00"
                      />
                    </div>
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


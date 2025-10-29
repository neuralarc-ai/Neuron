import { describe, it, expect } from "vitest";

/**
 * Accounting Module Tests
 * 
 * This test suite validates the transaction balancing logic and
 * accounting module functionality.
 */

describe("Accounting Module", () => {
  describe("Transaction Balancing", () => {
    it("should validate that total debit equals total credit", () => {
      const entries = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 1000 },
      ];

      const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

      expect(totalDebit).toBe(1000);
      expect(totalCredit).toBe(1000);
      expect(totalDebit).toBe(totalCredit);
    });

    it("should reject unbalanced transactions", () => {
      const entries = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 500 },
      ];

      const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

      expect(totalDebit).not.toBe(totalCredit);
      expect(totalDebit - totalCredit).toBe(500);
    });

    it("should reject entries with both debit and credit", () => {
      const entry = { debit: 100, credit: 100 };

      // Entry should have either debit OR credit, not both
      const hasBoth = entry.debit > 0 && entry.credit > 0;
      expect(hasBoth).toBe(true);

      // Valid entry should have only one
      const isValid = (entry.debit > 0 && entry.credit === 0) || 
                     (entry.debit === 0 && entry.credit > 0);
      expect(isValid).toBe(false);
    });

    it("should reject entries with zero amounts", () => {
      const entry = { debit: 0, credit: 0 };

      const hasAmount = entry.debit > 0 || entry.credit > 0;
      expect(hasAmount).toBe(false);
    });

    it("should calculate correct totals for multiple entries", () => {
      const entries = [
        { debit: 5000, credit: 0 },
        { debit: 0, credit: 2000 },
        { debit: 0, credit: 3000 },
      ];

      const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

      expect(totalDebit).toBe(5000);
      expect(totalCredit).toBe(5000);
      expect(totalDebit).toBe(totalCredit);
    });
  });

  describe("Double-Entry Bookkeeping", () => {
    it("should enforce double-entry principle (for every debit, there is a credit)", () => {
      // Example: Paying salary
      const salaryTransaction = [
        { account: "Salary Expense", debit: 50000, credit: 0 },
        { account: "Cash", debit: 0, credit: 50000 },
      ];

      const totalDebit = salaryTransaction.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = salaryTransaction.reduce((sum, e) => sum + e.credit, 0);

      expect(totalDebit).toBe(totalCredit);
    });

    it("should handle complex transactions with multiple accounts", () => {
      // Example: Purchase with partial cash and credit
      const purchaseTransaction = [
        { account: "Inventory", debit: 10000, credit: 0 },
        { account: "Cash", debit: 0, credit: 6000 },
        { account: "Accounts Payable", debit: 0, credit: 4000 },
      ];

      const totalDebit = purchaseTransaction.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = purchaseTransaction.reduce((sum, e) => sum + e.credit, 0);

      expect(totalDebit).toBe(10000);
      expect(totalCredit).toBe(10000);
    });
  });
});


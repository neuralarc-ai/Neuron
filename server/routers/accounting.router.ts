import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getSupabaseClient } from "../supabaseClient";

export const accountingRouter = router({
  // Create a new account
  createAccount: publicProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
        parentId: z.number().optional(),
        balance: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
          .from("accounting_accounts")
          .insert({
            code: input.code,
            name: input.name,
            type: input.type,
            parent_id: input.parentId || null,
            balance: input.balance,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create account: ${error.message}`);
        }

        return { success: true, account: data };
      } catch (error) {
        throw new Error(`Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Create transaction using RPC function (atomic)
  createTransaction: publicProcedure
    .input(
      z.object({
        date: z.string(), // ISO date string
        description: z.string().optional(),
        reference: z.string().optional(),
        status: z.enum(["draft", "posted"]).default("draft"),
        entries: z.array(
          z.object({
            accountId: z.number(),
            categoryId: z.number().optional(),
            vendorId: z.number().optional(),
            description: z.string().optional(),
            debit: z.number().default(0),
            credit: z.number().default(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate entries balance before calling RPC
        const totalDebit = input.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
        const totalCredit = input.entries.reduce((sum, e) => sum + (e.credit || 0), 0);

        if (totalDebit !== totalCredit) {
          throw new Error(
            `Transaction unbalanced: Total debit (${totalDebit}) does not equal total credit (${totalCredit})`
          );
        }

        // Validate each entry
        for (const entry of input.entries) {
          if (entry.debit < 0 || entry.credit < 0) {
            throw new Error("Debit and credit amounts must be non-negative");
          }
          if (entry.debit > 0 && entry.credit > 0) {
            throw new Error("Entry cannot have both debit and credit");
          }
          if (entry.debit === 0 && entry.credit === 0) {
            throw new Error("Entry must have either debit or credit");
          }
        }

        const supabase = getSupabaseClient();

        // Call the RPC function through Supabase
        const { data: transactionId, error: rpcError } = await supabase.rpc("accounting_create_transaction", {
          p_date: input.date,
          p_description: input.description || null,
          p_entries: input.entries.map((e) => ({
            account_id: e.accountId,
            category_id: e.categoryId || null,
            vendor_id: e.vendorId || null,
            description: e.description || null,
            debit: e.debit || 0,
            credit: e.credit || 0,
          })),
          p_reference: input.reference || null,
          p_status: input.status,
          p_created_by: ctx.userId || null,
        });

        if (rpcError) {
          // If RPC fails (function might not be exposed), create transaction manually
          console.warn("[Accounting] RPC call failed, creating transaction manually:", rpcError.message);
          
          // Generate transaction number (try RPC, fallback to manual generation)
          let transactionNumber = `TXN-${Date.now()}`;
          const { data: txNumberData, error: txNumError } = await supabase.rpc("accounting_generate_transaction_number");
          if (!txNumError && txNumberData) {
            transactionNumber = txNumberData;
          }
          
          const totalAmount = totalDebit;

          // Create transaction
          const { data: transaction, error: txError } = await supabase
            .from("accounting_transactions")
            .insert({
              transaction_number: transactionNumber,
              date: input.date,
              description: input.description || null,
              reference: input.reference || null,
              status: input.status,
              total_amount: totalAmount,
              created_by: ctx.userId || null,
            })
            .select()
            .single();

          if (txError) {
            throw new Error(`Failed to create transaction: ${txError.message}`);
          }

          // Create entries
          const entriesToInsert = input.entries.map((e) => ({
            transaction_id: transaction.id,
            account_id: e.accountId,
            category_id: e.categoryId || null,
            vendor_id: e.vendorId || null,
            description: e.description || null,
            debit: e.debit || 0,
            credit: e.credit || 0,
          }));

          const { error: entriesError } = await supabase
            .from("accounting_entries")
            .insert(entriesToInsert);

          if (entriesError) {
            throw new Error(`Failed to create entries: ${entriesError.message}`);
          }

          return { success: true, transactionId: transaction.id };
        }

        return { success: true, transactionId: transactionId };
      } catch (error) {
        throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Get transactions with filters
  getTransactions: publicProcedure
    .input(
      z
        .object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          status: z.enum(["draft", "posted"]).optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        const supabase = getSupabaseClient();
        
        let query = supabase
          .from("accounting_transactions")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .range(input?.offset || 0, (input?.offset || 0) + (input?.limit || 50) - 1);

        if (input?.startDate) {
          query = query.gte("date", input.startDate);
        }
        if (input?.endDate) {
          query = query.lte("date", input.endDate);
        }
        if (input?.status) {
          query = query.eq("status", input.status);
        }

        const { data: transactions, error } = await query;

        if (error) {
          console.error("[Accounting] Transactions query error:", error);
          return [];
        }

        // Fetch entries for transactions
        if (transactions && transactions.length > 0) {
          const transactionIds = transactions.map((t: any) => t.id);
          const { data: entries } = await supabase
            .from("accounting_entries")
            .select("*")
            .in("transaction_id", transactionIds);

          // Group entries by transaction_id
          const entriesByTransaction = (entries || []).reduce((acc: any, entry: any) => {
            if (!acc[entry.transaction_id]) {
              acc[entry.transaction_id] = [];
            }
            acc[entry.transaction_id].push(entry);
            return acc;
          }, {} as Record<number, any[]>);

          // Attach entries to transactions
          transactions.forEach((transaction: any) => {
            (transaction as any).entries = entriesByTransaction[transaction.id] || [];
          });
        }

        return transactions || [];
      } catch (error) {
        console.error("[Accounting] Transactions query error:", error);
        return [];
      }
    }),

  // Get summary for a specific month/year
  getSummary: publicProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const supabase = getSupabaseClient();
        const startDate = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
        const endDate = `${input.year}-${String(input.month).padStart(2, "0")}-31`;

        // Get all posted transactions for the month
        const { data: transactions, error: txError } = await supabase
          .from("accounting_transactions")
          .select("id, total_amount, status")
          .eq("status", "posted")
          .gte("date", startDate)
          .lte("date", endDate);

        if (txError) {
          console.error("[Accounting] Summary query error:", txError);
          return {
            totalTransactions: 0,
            totalAmount: 0,
            categories: [],
            topCategories: [],
          };
        }

        if (!transactions || transactions.length === 0) {
          return {
            totalTransactions: 0,
            totalAmount: 0,
            categories: [],
            topCategories: [],
          };
        }

        const transactionIds = transactions.map((t: any) => t.id);
        
        // Get entries for these transactions
        const { data: entries, error: entriesError } = await supabase
          .from("accounting_entries")
          .select("category_id, debit, credit")
          .in("transaction_id", transactionIds);

        if (entriesError) {
          console.error("[Accounting] Summary entries query error:", entriesError);
          return {
            totalTransactions: transactions.length,
            totalAmount: transactions.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0),
            categories: [],
            topCategories: [],
          };
        }

        // Calculate totals by category
        const categoryTotals: Record<number, { name: string; total: number }> = {};

        entries?.forEach((entry: any) => {
          if (entry.category_id) {
            if (!categoryTotals[entry.category_id]) {
              categoryTotals[entry.category_id] = { name: "", total: 0 };
            }
            categoryTotals[entry.category_id].total += parseFloat(entry.debit || entry.credit || 0);
          }
        });

        // Get category names
        const categoryIds = Object.keys(categoryTotals).map(Number);
        if (categoryIds.length > 0) {
          const { data: categories } = await supabase
            .from("accounting_categories")
            .select("id, name")
            .in("id", categoryIds);

          categories?.forEach((cat: any) => {
            if (categoryTotals[cat.id]) {
              categoryTotals[cat.id].name = cat.name;
            }
          });
        }

        const categoryList = Object.values(categoryTotals);
        const topCategories = categoryList
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        const totalAmount = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0);

        return {
          totalTransactions: transactions.length,
          totalAmount,
          categories: categoryList,
          topCategories,
        };
      } catch (error) {
        console.error("[Accounting] Summary query error:", error);
        return {
          totalTransactions: 0,
          totalAmount: 0,
          categories: [],
          topCategories: [],
        };
      }
    }),

  // Get all categories
  getCategories: publicProcedure.query(async ({ ctx }) => {
    try {
      const supabase = getSupabaseClient();

      const { data: categories, error } = await supabase
        .from("accounting_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("[Accounting] Categories query error:", error);
        console.error("[Accounting] Error code:", error.code);
        console.error("[Accounting] Error details:", error.details);
        console.error("[Accounting] Error hint:", error.hint);
        return [];
      }

      console.log(`[Accounting] getCategories: Found ${categories?.length || 0} categories`);
      return categories || [];
    } catch (error) {
      console.error("[Accounting] Categories query error:", error);
      if (error instanceof Error) {
        console.error("[Accounting] Error message:", error.message);
        console.error("[Accounting] Error stack:", error.stack);
      }
      return [];
    }
  }),

  // Get all accounts
  getAccounts: publicProcedure.query(async ({ ctx }) => {
    try {
      const supabase = getSupabaseClient();

      const { data: accounts, error } = await supabase
        .from("accounting_accounts")
        .select("*")
        .eq("is_active", true)
        .order("code");

      if (error) {
        console.error("[Accounting] Accounts query error:", error);
        console.error("[Accounting] Error code:", error.code);
        console.error("[Accounting] Error details:", error.details);
        console.error("[Accounting] Error hint:", error.hint);
        return [];
      }

      console.log(`[Accounting] getAccounts: Found ${accounts?.length || 0} accounts`);
      return accounts || [];
    } catch (error) {
      console.error("[Accounting] Accounts query error:", error);
      if (error instanceof Error) {
        console.error("[Accounting] Error message:", error.message);
        console.error("[Accounting] Error stack:", error.stack);
      }
      return [];
    }
  }),

  // Get all vendors
  getVendors: publicProcedure.query(async ({ ctx }) => {
    try {
      const supabase = getSupabaseClient();

      const { data: vendors, error } = await supabase
        .from("accounting_vendors")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("[Accounting] Vendors query error:", error);
        console.error("[Accounting] Error code:", error.code);
        console.error("[Accounting] Error details:", error.details);
        console.error("[Accounting] Error hint:", error.hint);
        return [];
      }

      console.log(`[Accounting] getVendors: Found ${vendors?.length || 0} vendors`);
      return vendors || [];
    } catch (error) {
      console.error("[Accounting] Vendors query error:", error);
      if (error instanceof Error) {
        console.error("[Accounting] Error message:", error.message);
        console.error("[Accounting] Error stack:", error.stack);
      }
      return [];
    }
  }),
});

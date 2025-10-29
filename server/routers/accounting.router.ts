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
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .schema("accounting")
        .from("accounts")
        .insert({
          code: input.code,
          name: input.name,
          type: input.type,
          parent_id: input.parentId,
          balance: input.balance,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create account: ${error.message}`);
      }

      return { success: true, account: data };
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
      const supabase = getSupabaseClient();

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

      // Prepare entries for JSONB
      const entriesJson = input.entries.map((e) => ({
        account_id: e.accountId,
        category_id: e.categoryId || null,
        vendor_id: e.vendorId || null,
        description: e.description || null,
        debit: e.debit || 0,
        credit: e.credit || 0,
      }));

      // Call RPC function - Use schema-qualified function name
      // Note: Supabase RPC may require the function to be in the public schema or callable with schema prefix
      const { data, error } = await supabase.rpc("create_transaction", {
        p_date: input.date,
        p_description: input.description || null,
        p_entries: entriesJson,
        p_reference: input.reference || null,
        p_status: input.status,
        p_created_by: ctx.userId,
      });

      if (error) {
        throw new Error(`Failed to create transaction: ${error.message}`);
      }

      return { success: true, transactionId: data };
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
      const supabase = getSupabaseClient();

      let query = supabase.schema("accounting").from("transactions").select("*");

      if (input?.startDate) {
        query = query.gte("date", input.startDate);
      }
      if (input?.endDate) {
        query = query.lte("date", input.endDate);
      }
      if (input?.status) {
        query = query.eq("status", input.status);
      }

      query = query.order("date", { ascending: false });
      query = query.order("created_at", { ascending: false });
      query = query.limit(input?.limit || 50);
      query = query.range(input?.offset || 0, (input?.offset || 0) + (input?.limit || 50) - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }

      // Also fetch entries for each transaction
      if (data && data.length > 0) {
        const transactionIds = data.map((t) => t.id);
        const { data: entries, error: entriesError } = await supabase
          .schema("accounting")
          .from("entries")
          .select("*")
          .in("transaction_id", transactionIds);

        if (!entriesError && entries) {
          // Group entries by transaction_id
          const entriesByTransaction = entries.reduce((acc, entry) => {
            if (!acc[entry.transaction_id]) {
              acc[entry.transaction_id] = [];
            }
            acc[entry.transaction_id].push(entry);
            return acc;
          }, {} as Record<number, any[]>);

          // Attach entries to transactions
          data.forEach((transaction) => {
            (transaction as any).entries = entriesByTransaction[transaction.id] || [];
          });
        }
      }

      return data || [];
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
      const supabase = getSupabaseClient();

      const startDate = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const endDate = `${input.year}-${String(input.month).padStart(2, "0")}-31`;

      // Get all posted transactions for the month
      const { data: transactions, error: transactionsError } = await supabase
        .schema("accounting")
        .from("transactions")
        .select("id, total_amount, status")
        .eq("status", "posted")
        .gte("date", startDate)
        .lte("date", endDate);

      if (transactionsError) {
        throw new Error(`Failed to fetch transactions: ${transactionsError.message}`);
      }

      // Get entries for these transactions
      const transactionIds = transactions?.map((t) => t.id) || [];
      if (transactionIds.length === 0) {
        return {
          totalTransactions: 0,
          totalAmount: 0,
          categories: [],
          topCategories: [],
        };
      }

      const { data: entries, error: entriesError } = await supabase
        .schema("accounting")
        .from("entries")
        .select("category_id, debit, credit")
        .in("transaction_id", transactionIds);

      if (entriesError) {
        throw new Error(`Failed to fetch entries: ${entriesError.message}`);
      }

      // Calculate totals by category
      const categoryTotals: Record<number, { name: string; total: number }> = {};

      entries?.forEach((entry) => {
        if (entry.category_id) {
          if (!categoryTotals[entry.category_id]) {
            categoryTotals[entry.category_id] = { name: "", total: 0 };
          }
          categoryTotals[entry.category_id].total += entry.debit || entry.credit || 0;
        }
      });

      // Get category names
      const categoryIds = Object.keys(categoryTotals).map(Number);
      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .schema("accounting")
          .from("categories")
          .select("id, name")
          .in("id", categoryIds);

        categories?.forEach((cat) => {
          if (categoryTotals[cat.id]) {
            categoryTotals[cat.id].name = cat.name;
          }
        });
      }

      const categoryList = Object.values(categoryTotals);
      const topCategories = categoryList
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      const totalAmount = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

      return {
        totalTransactions: transactions?.length || 0,
        totalAmount,
        categories: categoryList,
        topCategories,
      };
    }),

  // Get all categories
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .schema("accounting")
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }),

  // Get all accounts
  getAccounts: publicProcedure.query(async ({ ctx }) => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .schema("accounting")
      .from("accounts")
      .select("*")
      .eq("is_active", true)
      .order("code");

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return data || [];
  }),

  // Get all vendors
  getVendors: publicProcedure.query(async ({ ctx }) => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .schema("accounting")
      .from("vendors")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch vendors: ${error.message}`);
    }

    return data || [];
  }),
});


# Accounting Module Setup Guide

This document provides instructions for setting up and using the accounting module in the Neuron HRMS application.

## 📋 Implementation Summary

The accounting module has been fully implemented with the following components:

### Files Created/Modified

**SQL Migration:**
- `migrations/001_create_accounting_tables.sql` - Complete database schema for accounting module

**Server-Side (tRPC):**
- `server/supabaseClient.ts` - Supabase client wrapper for server-side operations
- `server/routers/accounting.router.ts` - Accounting API router with all CRUD operations
- `server/_core/context.ts` - Updated to include Supabase client and user ID
- `server/routers.ts` - Added accounting router to main app router

**Frontend (React):**
- `client/src/pages/Revenue.tsx` - Main Revenue page with tabs
- `client/src/components/TransactionForm.tsx` - Form for creating transactions
- `client/src/components/AccountingDashboard.tsx` - Dashboard showing summaries and top categories
- `client/src/App.tsx` - Added Revenue route
- `client/src/components/DashboardLayout.tsx` - Added Revenue menu item to sidebar

**Tests:**
- `tests/accounting.test.ts` - Test suite for transaction balancing logic

**Documentation:**
- `README.md` - Updated with accounting module setup instructions

## 🚀 Setup Instructions

### Step 1: Run SQL Migration

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `migrations/001_create_accounting_tables.sql`
4. Execute the script

This will create:
- `accounting` schema
- Tables: `accounts`, `categories`, `vendors`, `transactions`, `entries`, `attachments`
- RPC function: `accounting.create_transaction` (atomic transaction creation)
- Seed data: Default categories (Salaries, TDS, Rent TDS, Operations, Interest, Vendors, Misc) and accounts

### Step 2: Configure Environment Variables

Ensure your `.env` file has:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key  # Use SERVICE ROLE KEY (not anon key)
JWT_SECRET=your-secret-key
```

**Important:** Use the **Service Role Key** from Supabase, not the anon key, as it bypasses RLS and allows server-side operations.

### Step 3: Start the Server

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev
```

### Step 4: Access Revenue Tab

Once the server is running:
1. Log in to the application
2. Click on "Revenue" in the sidebar
3. You'll see two tabs:
   - **Dashboard**: Monthly summaries, top categories, recent transactions
   - **Create Transaction**: Form to add new accounting transactions

## 📝 Usage

### Creating a Transaction

1. Navigate to Revenue → Create Transaction
2. Fill in:
   - Date
   - Status (Draft or Posted)
   - Description (optional)
   - Reference (optional)
3. Add entries:
   - Select Account (required)
   - Select Category (optional)
   - Enter Description (optional)
   - Enter either Debit OR Credit amount (not both)
4. Ensure total debit equals total credit (balancing validation)
5. Click "Create Transaction"

### Viewing Summary

1. Navigate to Revenue → Dashboard
2. Select month and year from dropdowns
3. View:
   - Total transactions count
   - Total transaction amount
   - Top categories by spending
   - Recent posted transactions

## 🧪 Testing

Run the test suite:

```bash
pnpm test
```

The tests validate:
- Transaction balancing logic
- Double-entry bookkeeping principles
- Entry validation rules

## 🔧 Technical Details

### Double-Entry Bookkeeping

The module enforces double-entry bookkeeping:
- Every transaction must have balanced debit and credit totals
- Each entry can have either debit OR credit (not both)
- The system validates balance before inserting into database

### Atomic Transactions

The `create_transaction` RPC function ensures:
- All entries are inserted atomically (all or nothing)
- Balance validation happens at database level
- Transaction number is auto-generated

### Data Flow

1. Frontend → tRPC client → `/api/trpc` endpoint
2. tRPC router → Supabase client → PostgreSQL
3. RPC function validates and inserts transaction + entries
4. Response returned to frontend

## 📚 API Endpoints

All endpoints are available through tRPC:

```typescript
// Get categories
trpc.accounting.getCategories.useQuery()

// Get accounts
trpc.accounting.getAccounts.useQuery()

// Get vendors
trpc.accounting.getVendors.useQuery()

// Get transactions
trpc.accounting.getTransactions.useQuery({ 
  startDate?: string, 
  endDate?: string, 
  status?: 'draft' | 'posted',
  limit?: number,
  offset?: number 
})

// Get summary
trpc.accounting.getSummary.useQuery({ month: number, year: number })

// Create transaction
trpc.accounting.createTransaction.useMutation({
  date: string,
  description?: string,
  reference?: string,
  status: 'draft' | 'posted',
  entries: Array<{
    accountId: number,
    categoryId?: number,
    vendorId?: number,
    description?: string,
    debit: number,
    credit: number
  }>
})

// Create account
trpc.accounting.createAccount.useMutation({
  code: string,
  name: string,
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
  parentId?: number,
  balance?: number
})
```

## ⚠️ Important Notes

1. **RPC Function**: The `create_transaction` function is in the `accounting` schema. If you encounter issues calling it, you may need to:
   - Ensure the function has proper grants (included in migration)
   - Use service role key (not anon key)
   - Verify function is callable: `SELECT accounting.create_transaction(...)`

2. **Schema Access**: The migration grants permissions to `authenticated` and `service_role` roles. Adjust as needed for your security requirements.

3. **Balancing**: Transactions are validated both client-side (for UX) and server-side (for security). The RPC function enforces balance at database level.

## 🐛 Troubleshooting

### "Failed to create transaction: function does not exist"
- Verify the SQL migration ran successfully
- Check function exists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'accounting'`
- Ensure you're using service role key

### "Transaction unbalanced" error
- Ensure total debit equals total credit
- Each entry should have either debit OR credit, not both
- Check for negative amounts (not allowed)

### Schema not found errors
- Verify migration created the `accounting` schema
- Check Supabase table list includes `accounting.*` tables

## 📊 Database Schema

The module uses:
- **accounts**: Chart of accounts
- **categories**: Revenue/expense categories
- **vendors**: Vendor information
- **transactions**: Transaction headers
- **entries**: Double-entry line items
- **attachments**: Transaction attachments (for future use)

All tables are in the `accounting` schema for better organization.


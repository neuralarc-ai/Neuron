-- ============================================================
-- Fix for Accounting Module RLS Issues in Production
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- Option 1: Disable RLS on accounting tables (Recommended for internal apps)
-- This allows the service role to access all data
ALTER TABLE IF EXISTS accounting_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_entries DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, create policies instead
-- Uncomment below and comment out Option 1 above if you prefer:

/*
-- Enable RLS (if not already enabled)
ALTER TABLE IF EXISTS accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow service role full access to accounts" ON accounting_accounts;
DROP POLICY IF EXISTS "Allow service role full access to categories" ON accounting_categories;
DROP POLICY IF EXISTS "Allow service role full access to vendors" ON accounting_vendors;
DROP POLICY IF EXISTS "Allow service role full access to transactions" ON accounting_transactions;
DROP POLICY IF EXISTS "Allow service role full access to entries" ON accounting_entries;

-- Create policies that allow service_role (server-side) and authenticated users to access
CREATE POLICY "Allow service role full access to accounts" ON accounting_accounts
FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to categories" ON accounting_categories
FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to vendors" ON accounting_vendors
FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to transactions" ON accounting_transactions
FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to entries" ON accounting_entries
FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
*/

-- Verify permissions
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'accounting_%'
ORDER BY tablename;

-- Grant permissions (ensure these are set)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION accounting_create_transaction TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION accounting_generate_transaction_number TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;


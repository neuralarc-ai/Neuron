-- ============================================================
-- Accounting Module Migration
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- Create accounting schema
CREATE SCHEMA IF NOT EXISTS accounting;

-- ============================================================
-- Accounts Table
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting.accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
  parent_id INTEGER REFERENCES accounting.accounts(id) ON DELETE SET NULL,
  balance DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================
-- Categories Table
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'revenue', 'expense'
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================
-- Vendors Table
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting.vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================
-- Transactions Table
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting.transactions (
  id SERIAL PRIMARY KEY,
  transaction_number VARCHAR(100) UNIQUE NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  reference VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- 'draft', 'posted'
  total_amount DECIMAL(15, 2) NOT NULL,
  created_by INTEGER, -- User ID
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  posted_at TIMESTAMP,
  CHECK (total_amount >= 0)
);

-- ============================================================
-- Entries Table (Double-entry bookkeeping)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting.entries (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES accounting.transactions(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounting.accounts(id),
  category_id INTEGER REFERENCES accounting.categories(id),
  vendor_id INTEGER REFERENCES accounting.vendors(id),
  description TEXT,
  debit DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  credit DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CHECK (debit >= 0 AND credit >= 0),
  CHECK ((debit = 0 AND credit > 0) OR (debit > 0 AND credit = 0))
);

-- ============================================================
-- Attachments Table
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting.attachments (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES accounting.transactions(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by INTEGER, -- User ID
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_date ON accounting.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON accounting.transactions(status);
CREATE INDEX IF NOT EXISTS idx_entries_transaction_id ON accounting.entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_entries_account_id ON accounting.entries(account_id);
CREATE INDEX IF NOT EXISTS idx_entries_category_id ON accounting.entries(category_id);
CREATE INDEX IF NOT EXISTS idx_attachments_transaction_id ON accounting.attachments(transaction_id);

-- ============================================================
-- Function: Generate Transaction Number
-- ============================================================
CREATE OR REPLACE FUNCTION accounting.generate_transaction_number()
RETURNS VARCHAR(100) AS $$
DECLARE
  next_num INTEGER;
  prefix VARCHAR(10) := 'TXN-';
  year_str VARCHAR(4) := TO_CHAR(NOW(), 'YYYY');
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM LENGTH(prefix || year_str || '-') + 1) AS INTEGER)), 0) + 1
  INTO next_num
  FROM accounting.transactions
  WHERE transaction_number LIKE prefix || year_str || '-%';
  
  RETURN prefix || year_str || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: Create Transaction (Atomic)
-- Validates debit == credit before inserting
-- ============================================================
CREATE OR REPLACE FUNCTION accounting.create_transaction(
  p_date DATE,
  p_description TEXT,
  p_entries JSONB,
  p_reference VARCHAR(255) DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT 'draft',
  p_created_by INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_transaction_id INTEGER;
  v_transaction_number VARCHAR(100);
  v_total_debit DECIMAL(15, 2) := 0;
  v_total_credit DECIMAL(15, 2) := 0;
  v_entry JSONB;
  v_account_id INTEGER;
  v_category_id INTEGER;
  v_vendor_id INTEGER;
  v_entry_description TEXT;
  v_debit DECIMAL(15, 2);
  v_credit DECIMAL(15, 2);
BEGIN
  -- Validate entries
  IF p_entries IS NULL OR jsonb_array_length(p_entries) = 0 THEN
    RAISE EXCEPTION 'At least one entry is required';
  END IF;

  -- Calculate total debit and credit
  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_debit := COALESCE((v_entry->>'debit')::DECIMAL, 0);
    v_credit := COALESCE((v_entry->>'credit')::DECIMAL, 0);
    
    IF v_debit < 0 OR v_credit < 0 THEN
      RAISE EXCEPTION 'Debit and credit amounts must be non-negative';
    END IF;
    
    IF v_debit > 0 AND v_credit > 0 THEN
      RAISE EXCEPTION 'Entry cannot have both debit and credit';
    END IF;
    
    IF v_debit = 0 AND v_credit = 0 THEN
      RAISE EXCEPTION 'Entry must have either debit or credit';
    END IF;
    
    v_total_debit := v_total_debit + v_debit;
    v_total_credit := v_total_credit + v_credit;
  END LOOP;

  -- Validate double-entry: debit must equal credit
  IF v_total_debit != v_total_credit THEN
    RAISE EXCEPTION 'Transaction unbalanced: Total debit (%) does not equal total credit (%)', 
      v_total_debit, v_total_credit;
  END IF;

  -- Generate transaction number
  v_transaction_number := accounting.generate_transaction_number();

  -- Insert transaction
  INSERT INTO accounting.transactions (
    transaction_number,
    date,
    description,
    reference,
    status,
    total_amount,
    created_by,
    posted_at
  ) VALUES (
    v_transaction_number,
    p_date,
    p_description,
    p_reference,
    p_status,
    v_total_debit,
    p_created_by,
    CASE WHEN p_status = 'posted' THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_transaction_id;

  -- Insert entries
  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_account_id := (v_entry->>'account_id')::INTEGER;
    v_category_id := NULLIF((v_entry->>'category_id')::INTEGER, NULL);
    v_vendor_id := NULLIF((v_entry->>'vendor_id')::INTEGER, NULL);
    v_entry_description := NULLIF(v_entry->>'description', NULL);
    v_debit := COALESCE((v_entry->>'debit')::DECIMAL, 0);
    v_credit := COALESCE((v_entry->>'credit')::DECIMAL, 0);

    -- Validate account exists
    IF NOT EXISTS (SELECT 1 FROM accounting.accounts WHERE id = v_account_id AND is_active = true) THEN
      RAISE EXCEPTION 'Account with id % does not exist or is inactive', v_account_id;
    END IF;

    INSERT INTO accounting.entries (
      transaction_id,
      account_id,
      category_id,
      vendor_id,
      description,
      debit,
      credit
    ) VALUES (
      v_transaction_id,
      v_account_id,
      v_category_id,
      v_vendor_id,
      v_entry_description,
      v_debit,
      v_credit
    );
  END LOOP;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Seed Categories
-- ============================================================
INSERT INTO accounting.categories (name, description, type) VALUES
  ('Salaries', 'Employee salary payments', 'expense'),
  ('TDS', 'Tax Deducted at Source', 'expense'),
  ('Rent TDS', 'Rent Tax Deducted at Source', 'expense'),
  ('Operations', 'Operational expenses', 'expense'),
  ('Interest', 'Interest payments', 'expense'),
  ('Vendors', 'Vendor payments', 'expense'),
  ('Misc', 'Miscellaneous expenses', 'expense')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Seed Default Accounts (Chart of Accounts)
-- ============================================================
INSERT INTO accounting.accounts (code, name, type, balance) VALUES
  ('1000', 'Cash', 'asset', 0),
  ('1100', 'Bank Account', 'asset', 0),
  ('2000', 'Accounts Payable', 'liability', 0),
  ('3000', 'Equity', 'equity', 0),
  ('4000', 'Revenue', 'revenue', 0),
  ('5000', 'Salaries Expense', 'expense', 0),
  ('5100', 'Rent Expense', 'expense', 0),
  ('5200', 'Utilities Expense', 'expense', 0),
  ('5300', 'Operations Expense', 'expense', 0),
  ('5400', 'Interest Expense', 'expense', 0),
  ('5500', 'Vendor Expenses', 'expense', 0),
  ('5900', 'Miscellaneous Expense', 'expense', 0)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Grant Permissions (adjust as needed for your RLS policies)
-- ============================================================
-- Grant execute permission on the function to authenticated users
-- For service role key (used in server), these grants may not be necessary
GRANT USAGE ON SCHEMA accounting TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA accounting TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION accounting.create_transaction TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA accounting TO authenticated, service_role;

-- If using Row Level Security (RLS), add appropriate policies here
-- Example:
-- ALTER TABLE accounting.transactions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own transactions" ON accounting.transactions
--   FOR SELECT USING (created_by = auth.uid());


-- Database Migration: Add Leave Management Features
-- Run this SQL script on your PostgreSQL database to add the new leave management functionality
-- Date: 2025

-- ============================================
-- 1. ALTER existing holidays table to add new fields
-- ============================================

-- Add new columns to holidays table (nullable for backward compatibility)
ALTER TABLE holidays 
ADD COLUMN IF NOT EXISTS "leaveType" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "numberOfDays" VARCHAR(10),
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add comment to document the leave types
COMMENT ON COLUMN holidays."leaveType" IS 'Leave types: CL (Casual Leave), SL (Sick Leave), PL (Privilege Leave), HalfDay, LWP (Leave Without Pay)';

-- ============================================
-- 2. CREATE new leaveBalances table
-- ============================================

CREATE TABLE IF NOT EXISTS "leaveBalances" (
  id SERIAL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  "leaveType" VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  "totalAllocated" INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  balance INTEGER NOT NULL DEFAULT 0,
  "carriedForward" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("employeeId", "leaveType", year)
);

-- Add foreign key constraint
ALTER TABLE "leaveBalances"
ADD CONSTRAINT fk_leave_balances_employee
FOREIGN KEY ("employeeId") 
REFERENCES employees(id) 
ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON "leaveBalances"("employeeId");
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON "leaveBalances"(year);
CREATE INDEX IF NOT EXISTS idx_leave_balances_type ON "leaveBalances"("leaveType");

-- ============================================
-- 3. CREATE company holidays table
-- ============================================

CREATE TABLE IF NOT EXISTS "companyHolidays" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  date TIMESTAMP NOT NULL,
  type VARCHAR(20) DEFAULT 'National',
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_company_holidays_date ON "companyHolidays"(date);
CREATE INDEX IF NOT EXISTS idx_company_holidays_active ON "companyHolidays"("isActive");

-- ============================================
-- 4. UPDATE existing settings table structure (if needed)
-- ============================================

-- Check if these columns don't exist, add them
DO $$ 
BEGIN
  -- Add CL allocation to settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='settings' AND column_name='clAllocation'
  ) THEN
    ALTER TABLE settings ADD COLUMN "clAllocation" INTEGER DEFAULT 12;
  END IF;

  -- Add SL allocation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='settings' AND column_name='slAllocation'
  ) THEN
    ALTER TABLE settings ADD COLUMN "slAllocation" INTEGER DEFAULT 12;
  END IF;

  -- Add PL allocation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='settings' AND column_name='plAllocation'
  ) THEN
    ALTER TABLE settings ADD COLUMN "plAllocation" INTEGER DEFAULT 15;
  END IF;

  -- Add LWP allocation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='settings' AND column_name='lwpAllocation'
  ) THEN
    ALTER TABLE settings ADD COLUMN "lwpAllocation" INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 5. INSERT default settings if not exists
-- ============================================

-- Update existing settings with default values for new columns
UPDATE settings 
SET 
  "clAllocation" = COALESCE("clAllocation", 12),
  "slAllocation" = COALESCE("slAllocation", 12),
  "plAllocation" = COALESCE("plAllocation", 15),
  "lwpAllocation" = COALESCE("lwpAllocation", 0)
WHERE "clAllocation" IS NULL 
   OR "slAllocation" IS NULL 
   OR "plAllocation" IS NULL 
   OR "lwpAllocation" IS NULL;

-- ============================================
-- 6. INSERT some common Indian holidays (optional)
-- ============================================

-- Insert default holidays if table is empty
INSERT INTO "companyHolidays" (name, date, type, "isActive")
SELECT 'Republic Day', '2025-01-26'::TIMESTAMP, 'National', true
WHERE NOT EXISTS (SELECT 1 FROM "companyHolidays" WHERE name = 'Republic Day' AND EXTRACT(YEAR FROM date) = 2025);

INSERT INTO "companyHolidays" (name, date, type, "isActive")
SELECT 'Independence Day', '2025-08-15'::TIMESTAMP, 'National', true
WHERE NOT EXISTS (SELECT 1 FROM "companyHolidays" WHERE name = 'Independence Day' AND EXTRACT(YEAR FROM date) = 2025);

INSERT INTO "companyHolidays" (name, date, type, "isActive")
SELECT 'Gandhi Jayanti', '2025-10-02'::TIMESTAMP, 'National', true
WHERE NOT EXISTS (SELECT 1 FROM "companyHolidays" WHERE name = 'Gandhi Jayanti' AND EXTRACT(YEAR FROM date) = 2025);

INSERT INTO "companyHolidays" (name, date, type, "isActive")
SELECT 'Diwali', '2025-10-23'::TIMESTAMP, 'National', true
WHERE NOT EXISTS (SELECT 1 FROM "companyHolidays" WHERE name = 'Diwali' AND EXTRACT(YEAR FROM date) = 2025);

-- ============================================
-- 7. Create function to initialize leave balances for employees
-- ============================================

CREATE OR REPLACE FUNCTION initialize_leave_balances()
RETURNS void AS $$
DECLARE
  current_year INTEGER;
  cl_alloc INTEGER;
  sl_alloc INTEGER;
  pl_alloc INTEGER;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Get allocations from settings
  SELECT "clAllocation", "slAllocation", "plAllocation" 
  INTO cl_alloc, sl_alloc, pl_alloc
  FROM settings 
  LIMIT 1;
  
  -- Set defaults if not found
  cl_alloc := COALESCE(cl_alloc, 12);
  sl_alloc := COALESCE(sl_alloc, 12);
  pl_alloc := COALESCE(pl_alloc, 15);
  
  -- Insert leave balances for all active employees if not exists
  INSERT INTO "leaveBalances" ("employeeId", "leaveType", year, "totalAllocated", used, balance, "carriedForward")
  SELECT 
    e.id,
    'CL',
    current_year,
    cl_alloc,
    0,
    cl_alloc,
    0
  FROM employees e
  WHERE e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM "leaveBalances" 
    WHERE "employeeId" = e.id 
    AND "leaveType" = 'CL' 
    AND year = current_year
  );
  
  INSERT INTO "leaveBalances" ("employeeId", "leaveType", year, "totalAllocated", used, balance, "carriedForward")
  SELECT 
    e.id,
    'SL',
    current_year,
    sl_alloc,
    0,
    sl_alloc,
    0
  FROM employees e
  WHERE e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM "leaveBalances" 
    WHERE "employeeId" = e.id 
    AND "leaveType" = 'SL' 
    AND year = current_year
  );
  
  INSERT INTO "leaveBalances" ("employeeId", "leaveType", year, "totalAllocated", used, balance, "carriedForward")
  SELECT 
    e.id,
    'PL',
    current_year,
    pl_alloc,
    0,
    pl_alloc,
    0
  FROM employees e
  WHERE e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM "leaveBalances" 
    WHERE "employeeId" = e.id 
    AND "leaveType" = 'PL' 
    AND year = current_year
  );
  
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Create trigger to auto-update balance calculation
-- ============================================

CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate balance when used is updated
  NEW.balance := NEW."totalAllocated" + NEW."carriedForward" - NEW.used;
  NEW."updatedAt" := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leaveBalances table
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON "leaveBalances";
CREATE TRIGGER trigger_update_leave_balance
  BEFORE INSERT OR UPDATE ON "leaveBalances"
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance();

-- ============================================
-- 9. Initialize leave balances for existing employees (run this manually)
-- ============================================

-- Uncomment the line below to initialize leave balances for all active employees
-- SELECT initialize_leave_balances();

-- ============================================
-- Migration Complete!
-- ============================================
-- 
-- What was added:
-- 1. Extended holidays table with leaveType, startDate, endDate, numberOfDays, reason
-- 2. Created leaveBalances table for tracking annual allocations
-- 3. Created companyHolidays table for managing holidays
-- 4. Added leave allocation columns to settings table
-- 5. Inserted default Indian holidays
-- 6. Created function to initialize leave balances
-- 7. Created trigger to auto-calculate leave balances
-- 
-- Next steps:
-- 1. Run: SELECT initialize_leave_balances(); to set up balances for existing employees
-- 2. Add more holidays as needed to companyHolidays table
-- 3. The system is now ready to use!
-- ============================================


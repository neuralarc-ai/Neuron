-- Supabase Migration Script for Neuron HRMS
-- This script creates all the necessary tables and enums for the HRMS system

-- Create enums
CREATE TYPE role AS ENUM ('user', 'admin');
CREATE TYPE status AS ENUM ('active', 'inactive');

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role role DEFAULT 'user' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create auth_users table
CREATE TABLE auth_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role role DEFAULT 'user' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastLogin" TIMESTAMP
);

-- Create employees table
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  address TEXT,
  "joiningDate" TIMESTAMP NOT NULL,
  designation VARCHAR(255) NOT NULL,
  "agreementRefId" VARCHAR(100),
  salary INTEGER NOT NULL,
  status status DEFAULT 'active' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create holidays table
CREATE TABLE holidays (
  id SERIAL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  "leavesTaken" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create salary_history table
CREATE TABLE salary_history (
  id SERIAL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  "oldSalary" INTEGER NOT NULL,
  "newSalary" INTEGER NOT NULL,
  "effectiveDate" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create payslips table
CREATE TABLE payslips (
  id SERIAL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  "grossSalary" INTEGER NOT NULL,
  tds INTEGER NOT NULL,
  deductions INTEGER NOT NULL,
  "netSalary" INTEGER NOT NULL,
  "pdfUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create settings table
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  "leaveQuotaPerMonth" INTEGER NOT NULL DEFAULT 2,
  "tdsRate" INTEGER NOT NULL DEFAULT 10,
  "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 22,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_holidays_employee ON holidays("employeeId");
CREATE INDEX idx_holidays_month_year ON holidays(month, year);
CREATE INDEX idx_salary_history_employee ON salary_history("employeeId");
CREATE INDEX idx_payslips_employee ON payslips("employeeId");
CREATE INDEX idx_payslips_month_year ON payslips(month, year);

-- Add foreign key constraints for data integrity
ALTER TABLE holidays ADD CONSTRAINT fk_holidays_employee 
  FOREIGN KEY ("employeeId") REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE salary_history ADD CONSTRAINT fk_salary_history_employee 
  FOREIGN KEY ("employeeId") REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE payslips ADD CONSTRAINT fk_payslips_employee 
  FOREIGN KEY ("employeeId") REFERENCES employees(id) ON DELETE CASCADE;

-- Insert default settings
INSERT INTO settings ("leaveQuotaPerMonth", "tdsRate", "workingDaysPerMonth") 
VALUES (2, 10, 22);

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your security needs)
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON auth_users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON employees FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON holidays FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON salary_history FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON payslips FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON settings FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON auth_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON holidays FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON salary_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON payslips FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON auth_users FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON employees FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON holidays FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON salary_history FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON payslips FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON settings FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON users FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON auth_users FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON employees FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON holidays FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON salary_history FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON payslips FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON settings FOR DELETE USING (true);

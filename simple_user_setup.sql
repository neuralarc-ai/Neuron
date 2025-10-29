-- Simple HRMS User Setup (Alternative Method)
-- This is a simpler approach using Supabase's built-in auth functions

-- Method 1: Using Supabase Dashboard (Recommended)
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user"
-- 3. Add these two users:

-- User 1:
-- Email: admin@neuronhrms.com
-- Password: admin123
-- Email Confirm: Yes

-- User 2:
-- Email: manager@neuronhrms.com  
-- Password: manager123
-- Email Confirm: Yes

-- Method 2: Using SQL (if Method 1 doesn't work)
-- Note: This method requires the pgcrypto extension

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Create admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('company_name', 'Neuron AI', 'Company name for the HRMS'),
('company_logo', '', 'Company logo URL'),
('default_leave_allocation_cl', '12', 'Default CL allocation per year'),
('default_leave_allocation_sl', '6', 'Default SL allocation per year'),
('default_leave_allocation_pl', '21', 'Default PL allocation per year'),
('currency', 'INR', 'Default currency for salary'),
('timezone', 'Asia/Kolkata', 'Default timezone')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin settings
CREATE POLICY "Admins can manage settings" ON admin_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON admin_settings TO authenticated;
GRANT USAGE ON SEQUENCE admin_settings_id_seq TO authenticated;

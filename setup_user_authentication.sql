-- HRMS User Authentication Setup
-- This script creates two admin users for the HRMS system

-- Enable the auth schema if not already enabled
-- (This is usually enabled by default in Supabase)

-- Create two admin users
-- Note: These users will need to set their passwords on first login
-- The email addresses will receive password reset links

-- User 1: Primary Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@neuronhrms.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "HR Admin", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- User 2: Secondary Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manager@neuronhrms.com',
  crypt('manager123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "HR Manager", "role": "manager"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create a user profiles table to store additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert user profiles
INSERT INTO user_profiles (id, email, name, role)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'name' as name,
  u.raw_user_meta_data->>'role' as role
FROM auth.users u
WHERE u.email IN ('admin@neuronhrms.com', 'manager@neuronhrms.com')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Create a function to handle new user signups (if needed later)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to get current user profile
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.name,
    up.role,
    up.created_at
  FROM user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;

-- Create an admin settings table for system configuration
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

-- Create policy for admin settings (only admins can modify)
CREATE POLICY "Admins can manage settings" ON admin_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Grant permissions for admin_settings
GRANT ALL ON admin_settings TO authenticated;
GRANT USAGE ON SEQUENCE admin_settings_id_seq TO authenticated;

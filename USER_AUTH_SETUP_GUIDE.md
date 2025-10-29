# HRMS User Authentication Setup Guide

## Overview
This guide will help you set up user authentication for your HRMS system with two admin users.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access Authentication
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** in the left sidebar
3. Click on **Users**

### Step 2: Create Users
Click **"Add user"** and create these two users:

#### User 1: Primary Admin
- **Email**: `admin@neuronhrms.com`
- **Password**: `admin123`
- **Email Confirm**: ✅ Yes
- **Auto Confirm User**: ✅ Yes

#### User 2: Secondary Admin  
- **Email**: `manager@neuronhrms.com`
- **Password**: `manager123`
- **Email Confirm**: ✅ Yes
- **Auto Confirm User**: ✅ Yes

### Step 3: Run Database Setup
Execute the `simple_user_setup.sql` file in your Supabase SQL editor to create the necessary tables and policies.

## Method 2: Using SQL Script

If you prefer to create users via SQL, run the `setup_user_authentication.sql` file in your Supabase SQL editor.

## Login Credentials

After setup, you can log in with:

### Admin Account
- **Email**: admin@neuronhrms.com
- **Password**: admin123

### Manager Account
- **Email**: manager@neuronhrms.com
- **Password**: manager123

## What Gets Created

### 1. User Profiles Table
Stores additional user information:
- User ID (linked to auth.users)
- Email
- Name
- Role (admin/manager)
- Created/Updated timestamps

### 2. Admin Settings Table
System configuration settings:
- Company name
- Company logo
- Leave allocations (CL, SL, PL)
- Currency
- Timezone

### 3. Security Policies
- Users can only view/update their own profiles
- Only admins can manage system settings
- Proper RLS policies for data security

## Testing the Setup

### 1. Test Login
1. Go to your HRMS application
2. Try logging in with the admin credentials
3. Verify you can access all features

### 2. Test User Management
1. Check if user profiles are created
2. Verify admin settings are accessible
3. Test document upload functionality

## Security Considerations

### 1. Change Default Passwords
After initial setup, change the default passwords:
1. Log in as admin
2. Go to user settings
3. Change password to something secure

### 2. Email Verification
- Users should verify their email addresses
- Consider enabling email confirmation for new users

### 3. Role Management
- Both users have admin privileges
- You can modify roles in the user_profiles table

## Troubleshooting

### Common Issues

#### 1. "User not found" Error
- Verify users were created successfully
- Check email addresses are correct
- Ensure users are confirmed

#### 2. "Permission denied" Error
- Check RLS policies are properly set
- Verify user roles in user_profiles table
- Ensure proper permissions are granted

#### 3. Login Not Working
- Check Supabase project URL and keys
- Verify authentication is enabled
- Check browser console for errors

### Debug Steps
1. Check Supabase Dashboard → Authentication → Users
2. Verify users exist and are confirmed
3. Check browser console for authentication errors
4. Test with different browsers/incognito mode

## Next Steps

After setting up authentication:

1. **Test Document Upload**
   - The RLS fix should now work with authenticated users
   - Try uploading KYC documents

2. **Configure System Settings**
   - Update company name and logo
   - Set leave allocation defaults
   - Configure currency and timezone

3. **Add More Users (Optional)**
   - Use the same process to add more users
   - Modify roles as needed

## Files Created

- `setup_user_authentication.sql` - Complete user setup with advanced features
- `simple_user_setup.sql` - Basic setup for tables and policies
- This guide for step-by-step instructions

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify Supabase project configuration
3. Check browser console for detailed error messages
4. Ensure all SQL scripts ran successfully

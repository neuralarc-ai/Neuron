# 🔧 **FIXING 401 ERRORS - SUPABASE SETUP**

## **The Issue:**
401 errors mean authentication/authorization problems. This is likely because:

1. **Row Level Security (RLS) is enabled** but no policies are set up
2. **Database tables don't exist yet**
3. **Anon key might be incorrect**

## **✅ STEP-BY-STEP FIX:**

### **Step 1: Run Database Migration**

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy the entire contents of `supabase-migration.sql`**
4. **Paste and run the migration script**

This will create all tables and set up proper policies.

### **Step 2: Verify Your Anon Key**

1. **Go to Settings → API**
2. **Make sure you're using the `anon public` key** (not the service role key)
3. **Copy the key again** and update your `.env` file

### **Step 3: Check RLS Policies**

After running the migration, verify that RLS policies are set up:

1. **Go to Authentication → Policies**
2. **Check that policies exist for all tables**
3. **Ensure policies allow public access** (for now)

### **Step 4: Test Database Connection**

```bash
# Restart your dev server after updating .env
npm run dev
```

## **🔍 Debugging Steps:**

### **Check if Tables Exist:**
1. Go to **Table Editor** in Supabase
2. Verify these tables exist:
   - `employees`
   - `users`
   - `auth_users`
   - `holidays`
   - `salary_history`
   - `payslips`
   - `settings`

### **Check RLS Status:**
1. Go to **Authentication → Policies**
2. Verify policies exist for all tables
3. Check that policies allow public access

### **Verify Anon Key:**
1. Go to **Settings → API**
2. Copy the `anon public` key (not service role)
3. Update your `.env` file

## **🚨 Common Issues:**

### **Issue 1: Tables Don't Exist**
**Solution:** Run the migration script in SQL Editor

### **Issue 2: RLS Policies Missing**
**Solution:** The migration script sets up policies, but verify they exist

### **Issue 3: Wrong Anon Key**
**Solution:** Use the `anon public` key, not the service role key

### **Issue 4: RLS Too Restrictive**
**Solution:** The migration sets up permissive policies for development

## **📋 Quick Checklist:**

- [ ] **Migration script run** in SQL Editor
- [ ] **Tables exist** in Table Editor
- [ ] **RLS policies exist** in Authentication → Policies
- [ ] **Correct anon key** in .env file
- [ ] **Dev server restarted** after .env changes

## **🎯 Expected Results:**

After fixing these issues:
- ✅ **No more 401 errors**
- ✅ **Dashboard loads with data**
- ✅ **Employee forms work**
- ✅ **All CRUD operations function**

**The 401 errors are just configuration issues - easily fixable!** 🚀

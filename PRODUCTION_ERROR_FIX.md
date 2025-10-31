# Production 504 Gateway Timeout Fix

## Problem
The production site shows:
- 504 Gateway Timeout errors for all accounting API calls
- "Unexpected token 'A', 'An error o'... is not valid JSON" errors
- This means the server is returning HTML error pages instead of JSON

## Root Causes
1. **Supabase client initialization failing** - Missing or incorrect environment variables
2. **Database queries timing out** - RLS policies or connection issues
3. **Server errors returning HTML instead of JSON** - Missing error handlers

## Fixes Applied

### 1. Error Handling Improvements
- ✅ Added proper error handling in tRPC middleware
- ✅ Ensured all errors return JSON, not HTML
- ✅ Added try-catch around Supabase client initialization
- ✅ Added detailed error logging

### 2. Database Connection Error Handling
- ✅ All accounting router queries now catch Supabase client initialization errors
- ✅ Return clear error messages about missing environment variables
- ✅ Proper error propagation to frontend

### 3. tRPC Error Handler
- ✅ Added `onError` callback to log all tRPC errors
- ✅ Ensured `Content-Type: application/json` header is always set
- ✅ Prevents HTML error pages from being returned

## Deployment Checklist

### Step 1: Verify Environment Variables in Production
Check that these are set in your production environment:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (NOT the anon key!)
- `SUPABASE_KEY` - Alternative name for service role key
- `SUPABASE_SECRET_KEY` - Alternative name for service role key

**Important**: You MUST use the **service_role** key, not the anon key, for server-side operations!

### Step 2: Run RLS Fix SQL
Execute `fix_accounting_rls.sql` in Supabase SQL Editor to disable RLS:
```sql
ALTER TABLE IF EXISTS accounting_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_entries DISABLE ROW LEVEL SECURITY;
```

### Step 3: Deploy Updated Code
Deploy these updated files:
- `server/_core/index.ts` - Added error handlers
- `server/_core/context.ts` - Better Supabase client error handling
- `server/routers/accounting.router.ts` - Better error handling in all queries
- `client/src/components/SimpleRevenueForm.tsx` - Better error display

### Step 4: Restart Server
After deploying:
1. Restart your production server
2. Check server logs for initialization messages
3. Look for: `[Supabase] ✅ Client initialized successfully`

### Step 5: Verify Fix
1. Open browser DevTools → Console
2. Navigate to Revenue page
3. Should now see proper JSON error messages instead of HTML
4. Check Network tab - API calls should return JSON responses

## Expected Behavior After Fix

### Before:
- ❌ 504 Gateway Timeout
- ❌ "Unexpected token 'A'" errors
- ❌ HTML error pages
- ❌ Infinite loading

### After:
- ✅ Proper JSON error responses
- ✅ Clear error messages like "Database connection failed: Missing SUPABASE_URL"
- ✅ Toast notifications showing errors
- ✅ Dropdowns showing error states instead of infinite loading

## Debugging

### Check Server Logs
Look for these patterns in server logs:

**Good signs:**
```
[Supabase] ✅ Client initialized successfully
[Supabase] Using SUPABASE_URL: https://xxx.supabase.co
```

**Bad signs:**
```
[Supabase] ❌ Missing environment variables: SUPABASE_URL
[Context] Failed to initialize Supabase client: ...
[tRPC] Error on path accounting.getAccounts: ...
```

### Test Database Connection
Run this in Supabase SQL Editor to verify tables exist:
```sql
SELECT COUNT(*) FROM accounting_accounts;
SELECT COUNT(*) FROM accounting_categories;
```

If these return numbers > 0, the tables exist and the issue is connection/RLS.

### Check Environment Variables
In your production hosting platform (Vercel, Railway, etc.):
1. Go to Environment Variables settings
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
3. **IMPORTANT**: The key must be the **service_role** key, found in:
   - Supabase Dashboard → Settings → API → Service Role Key (secret)

## Common Issues

### Issue: "Database connection failed: Missing SUPABASE_URL"
**Fix**: Add `SUPABASE_URL` environment variable in production

### Issue: "Database connection failed: Missing SUPABASE_KEY"
**Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` environment variable in production

### Issue: Still getting 504 errors
**Fix**: 
1. Check if database queries are timing out (RLS blocking)
2. Run the RLS fix SQL script
3. Check Supabase project status (is it paused?)

### Issue: "new row violates row-level security policy"
**Fix**: Run the RLS disable SQL from `fix_accounting_rls.sql`

## Files Changed
- `server/_core/index.ts` - Error handling middleware
- `server/_core/context.ts` - Supabase client error handling
- `server/routers/accounting.router.ts` - Query error handling
- `client/src/components/SimpleRevenueForm.tsx` - Error display


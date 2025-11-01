# Vercel Errors Fix Summary

## Errors Fixed

### 1. ✅ Invalid URL Error
**Error**: `TypeError: Invalid URL at new URL`

**Root Cause**: Vercel's serverless functions may pass relative URLs or malformed URLs to `fetchRequestHandler`.

**Fix Applied**:
- Added URL validation and reconstruction in `api/index.ts`
- If URL is invalid, reconstruct it using Vercel headers (`x-vercel-host`, `x-forwarded-proto`)
- Create a new valid Request object before passing to `fetchRequestHandler`

**Files Changed**:
- `api/index.ts` - Enhanced URL handling with fallback reconstruction

### 2. ✅ 504 Timeout Errors
**Error**: `Vercel Runtime Timeout Error: Task timed out after 10 seconds`

**Root Cause**: 
- Supabase queries taking longer than 10 seconds (Vercel Hobby plan limit)
- Missing query optimization
- No timeout handling

**Fixes Applied**:
- Added 8-second query timeout (fails fast before Vercel's 10s limit)
- Optimized queries to select only necessary columns
- Added query limits (1000 records max)
- Improved error messages for timeout scenarios

**Files Changed**:
- `server/routers/accounting.router.ts` - Added timeouts to `getAccounts` and `getCategories`
- `client/src/components/SimpleRevenueForm.tsx` - Added retry logic and better error handling

## Changes Made

### api/index.ts
```typescript
// Before: Direct URL parsing could fail
new URL(request.url)

// After: Validate and reconstruct URL if needed
let validRequest = request;
try {
  new URL(request.url);
} catch {
  // Reconstruct using Vercel headers
  const host = request.headers.get('host') || request.headers.get('x-vercel-host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const url = `${protocol}://${host}${pathname}...`;
  validRequest = new Request(url, {...});
}
```

### server/routers/accounting.router.ts
```typescript
// Added 8-second timeout to prevent Vercel 504
const queryPromise = supabase.from(...).select(...);
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Query timeout")), 8000)
);

const result = await Promise.race([queryPromise, timeoutPromise]);
```

### client/src/components/SimpleRevenueForm.tsx
```typescript
// Added retry logic with exponential backoff
const { data: accounts } = trpc.accounting.getAccounts.useQuery(undefined, {
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  staleTime: 30000,
  onError: (error) => {
    toast.error("Failed to load accounts. Please refresh the page.");
  },
});
```

## Deployment Steps

1. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Fix Invalid URL and 504 timeout errors in Vercel deployment"
   git push origin main
   ```

2. **Monitor Vercel deployment**:
   - Wait for deployment to complete
   - Check build logs for any errors
   - Verify deployment succeeded

3. **Test after deployment**:
   - Visit your live site
   - Check browser console for errors
   - Test the dropdowns (accounts, categories)
   - Check Vercel logs - should see fewer errors

## Expected Results

✅ **Invalid URL errors**: Should be resolved
- URL is now validated and reconstructed if needed
- `fetchRequestHandler` receives a valid Request object

✅ **504 Timeout errors**: Should be reduced or eliminated
- Queries timeout at 8 seconds (before Vercel's 10s limit)
- Better error messages for timeouts
- Frontend retries automatically on failure

✅ **User Experience**: Improved
- Dropdowns show loading states
- Clear error messages if queries fail
- Automatic retries reduce transient failures

## If Errors Persist

### Invalid URL still occurring:
1. Check if latest code is deployed
2. Check Vercel logs for the exact URL being passed
3. Verify `x-vercel-host` header is available

### 504 Timeouts still occurring:
1. **Check Supabase performance**:
   - Run query directly in Supabase SQL editor
   - Check query execution time
   - Add database indexes if needed:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounting_accounts(is_active);
     CREATE INDEX IF NOT EXISTS idx_categories_is_active ON accounting_categories(is_active);
     ```

2. **Consider upgrading**:
   - Vercel Pro plan: 60-second timeout (vs 10s on Hobby)
   - Better for slow database queries

3. **Alternative solutions**:
   - Cache query results (Redis/Upstash)
   - Use Supabase Edge Functions for better performance
   - Implement pagination for large datasets

## Monitoring

After deployment, monitor:
1. **Vercel Logs** - Should see fewer errors
2. **Browser Console** - No Invalid URL errors
3. **Network Tab** - Queries completing faster
4. **User Reports** - Dropdowns working correctly

## Success Indicators

✅ No "Invalid URL" errors in Vercel logs
✅ No 504 timeout errors (or significantly reduced)
✅ Dropdowns populate with data
✅ Form loads without blocking
✅ Error messages are user-friendly


# Fix for 406 "Not Acceptable" Error

## Problem
The production site is showing **406 Not Acceptable** errors, which means the server is rejecting requests because it doesn't accept the request format or headers.

## Root Cause
The tRPC client wasn't sending proper `Accept` and `Content-Type` headers, and the server wasn't explicitly configured to accept JSON requests.

## Fixes Applied

### 1. Client-Side (tRPC Client)
- ✅ Added explicit `Accept: application/json` header
- ✅ Added explicit `Content-Type: application/json` header
- ✅ Headers are set both in `headers()` function and `fetch()` call

### 2. Server-Side (Express)
- ✅ Added CORS middleware for tRPC requests
- ✅ Explicitly set `Content-Type: application/json` header
- ✅ Configured body parser to accept `application/json` and `text/json`
- ✅ Added OPTIONS handler for preflight requests

## Deployment Steps

### Step 1: Deploy Updated Code
Deploy these files:
- `client/src/main.tsx` - Added proper headers to tRPC client
- `server/_core/index.ts` - Added CORS and header handling

### Step 2: Clear Browser Cache
After deployment:
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Or clear browser cache completely
3. This ensures the new client code is loaded

### Step 3: Verify Fix
1. Open browser DevTools → Network tab
2. Navigate to Revenue page
3. Check API requests:
   - Should show `Accept: application/json` header
   - Should show `Content-Type: application/json` header
   - Should return 200 status (not 406)

## Expected Behavior

### Before:
- ❌ 406 Not Acceptable errors
- ❌ API requests rejected
- ❌ "Loading accounts and categories..." stuck
- ❌ "Error fetching leaves" errors

### After:
- ✅ 200 OK responses
- ✅ API requests accepted
- ✅ Data loads properly
- ✅ No 406 errors

## Debugging

### Check Request Headers
In DevTools → Network tab, click on any failed request and check:
- **Request Headers** should include:
  ```
  Accept: application/json
  Content-Type: application/json
  ```

### Check Response
Failed requests should now show proper JSON error messages instead of 406:
```json
{
  "error": {
    "message": "Database connection failed: ..."
  }
}
```

### If Still Getting 406
1. **Check server logs** - Look for CORS or header-related errors
2. **Verify deployment** - Make sure both client and server code was deployed
3. **Clear cache** - Browser might be using cached JavaScript
4. **Check Content-Type** - Ensure server is returning `application/json`

## Additional Notes

The "Error fetching leaves" errors you're seeing are likely from the Leaves page trying to load data, but they're not directly related to the Revenue page. However, fixing the 406 errors should resolve those as well since they're all tRPC requests.


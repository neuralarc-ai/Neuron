# Vercel Deployment Checklist

## Before Deploying

### 1. Environment Variables (Set in Vercel Dashboard)
Go to: Settings → Environment Variables

Add these variables:
- [ ] `SUPABASE_URL` or `VITE_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_SERVICE_ROLE_KEY`
- [ ] `JWT_SECRET` (optional, defaults to "neuron-hrms-secret-key")

Set them for: Production, Preview, and Development

### 2. Code Changes Made
- [x] Updated `api/index.ts` to properly handle tRPC requests
- [x] Updated `server/_core/context.ts` to work with both Express and Vercel
- [x] Optimized `getVendors` query to prevent timeouts
- [x] Made vendors query optional in frontend components
- [x] Updated `vercel.json` with proper build configuration

### 3. Build Test (Run Locally)
```bash
npm install
npm run build
```
- [ ] Build completes without errors
- [ ] `dist/public/` folder is created
- [ ] `dist/public/index.html` exists
- [ ] `dist/public/assets/` contains CSS and JS files

### 4. Database Setup
- [ ] All migrations applied in Supabase
- [ ] Database indexes created (optional but recommended):
  ```sql
  CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON accounting_vendors(is_active);
  CREATE INDEX IF NOT EXISTS idx_vendors_name ON accounting_vendors(name);
  ```

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)
1. [ ] Push code to GitHub:
   ```bash
   git add .
   git commit -m "Fix Vercel deployment and API handler"
   git push origin main
   ```
2. [ ] Vercel will automatically deploy
3. [ ] Wait for build to complete (check Vercel dashboard)

### Option 2: Manual Deployment
1. [ ] Go to Vercel Dashboard
2. [ ] Click "Deploy" → "Import Project"
3. [ ] Connect your repository
4. [ ] Configure project settings
5. [ ] Deploy

## After Deployment

### 1. Verify Static Files
- [ ] Visit: `https://your-domain.vercel.app/`
- [ ] Check browser console - no 404 errors for CSS/JS files
- [ ] Page loads correctly

### 2. Verify API Endpoints
- [ ] Health check: `https://your-domain.vercel.app/api/health`
  - Should return: `{"status":"ok","timestamp":"..."}`
- [ ] tRPC endpoint: Open DevTools → Network tab
  - Check requests to `/api/trpc/accounting.getAccounts`
  - Should return data, not 404 or 504

### 3. Test Functionality
- [ ] Login works
- [ ] Revenue/Expenses form loads
- [ ] Accounts/Categories/Vendors load (vendors might timeout but shouldn't block)
- [ ] Transactions can be created
- [ ] Dashboard displays data

### 4. Check Vercel Logs
- [ ] Go to Vercel Dashboard → Your Project → Functions
- [ ] Check for any errors in logs
- [ ] Verify API requests are being handled

## Troubleshooting

### Build Fails
**Check:**
- Environment variables are set
- `package.json` has all dependencies
- Build logs in Vercel dashboard

### API Returns 404
**Check:**
- `api/index.ts` exists and exports default handler
- Routes in `vercel.json` are correct
- Function logs in Vercel dashboard

### API Returns 504 Timeout
**Check:**
- Database connection is working
- Environment variables are correct
- Query performance (check Supabase dashboard)

### CSS/JS Files 404
**Solution:**
- Rebuild and redeploy
- Check `dist/public/assets/` exists after build
- Verify file hashes match in `index.html`

## Monitoring

After deployment, monitor:
1. **Vercel Function Logs** - Check for errors
2. **Supabase Dashboard** - Monitor query performance
3. **Browser Console** - Check for frontend errors
4. **Network Tab** - Verify API calls succeed

## Success Indicators

✅ All checklist items completed
✅ No 404 errors in browser console
✅ API endpoints responding correctly
✅ Forms load and function properly
✅ No 504 timeout errors (or they're handled gracefully)


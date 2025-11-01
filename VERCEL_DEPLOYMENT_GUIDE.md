# Vercel Deployment Guide

This guide will help you deploy your Neuron HRMS application to Vercel.

## Prerequisites

1. Vercel account (free tier works)
2. GitHub/GitLab/Bitbucket repository connected to Vercel
3. Supabase project with all environment variables set

## Deployment Setup

### 1. Environment Variables

Make sure you have these environment variables set in your Vercel project settings:

**Required:**
- `SUPABASE_URL` or `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

**Optional:**
- `JWT_SECRET` - For session management (defaults to "neuron-hrms-secret-key")
- `NODE_ENV` - Set to "production" (usually set automatically)

**How to set in Vercel:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for Production, Preview, and Development environments

### 2. Build Configuration

The `vercel.json` file is already configured:
- **Build Command**: `npm run build` (runs `vite build`)
- **Output Directory**: `dist/public`
- **API Routes**: Handled by `api/index.ts` (serverless function)

### 3. Project Structure

```
├── api/
│   └── index.ts          # Vercel serverless function handler
├── server/
│   ├── _core/
│   │   ├── context.ts   # tRPC context (works with both Express & Vercel)
│   │   └── trpc.ts
│   └── routers/         # tRPC routers
├── client/              # Frontend React app
├── dist/                # Build output (generated)
│   └── public/          # Static files served by Vercel
└── vercel.json          # Vercel configuration
```

### 4. Deployment Steps

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment"
   git push origin main
   ```

2. **Vercel will automatically deploy** if you have auto-deploy enabled

3. **Or manually deploy:**
   - Go to Vercel Dashboard
   - Click "Deploy" → "Import Project"
   - Select your repository
   - Vercel will detect the configuration automatically

### 5. Verifying Deployment

After deployment:

1. **Check the API endpoint:**
   ```
   https://your-domain.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check tRPC endpoint:**
   ```
   https://your-domain.vercel.app/api/trpc/accounting.getAccounts
   ```
   Should return tRPC response with accounts data

3. **Check frontend:**
   ```
   https://your-domain.vercel.app/
   ```
   Should load your React application

## Troubleshooting

### Issue: 404 on CSS/JS files
**Solution**: Rebuild and redeploy. The file hashes change with each build.

### Issue: 504 Gateway Timeout on API calls
**Possible causes:**
1. Slow database queries (add indexes)
2. Missing environment variables
3. Network issues between Vercel and Supabase

**Solutions:**
- Check Vercel function logs in dashboard
- Verify all environment variables are set
- Check Supabase dashboard for query performance
- Review the optimizations made to `getVendors` query

### Issue: API returns 404
**Check:**
1. Is `api/index.ts` present?
2. Is the route correct in `vercel.json`?
3. Are there any build errors?

### Issue: "Module not found" errors
**Solution:**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check build logs in Vercel dashboard

### Issue: CORS errors
**Solution:** The API handler already includes CORS headers. If issues persist:
- Check browser console for specific error
- Verify the API endpoint is being called correctly

## Build Optimization

The current build creates optimized bundles:
- CSS is minified and hashed
- JavaScript is code-split
- Assets are optimized

## Monitoring

Monitor your deployment:
1. **Vercel Dashboard** → View function logs
2. **Supabase Dashboard** → Monitor database queries
3. **Browser DevTools** → Check network requests

## Updating Deployment

Every push to your main branch will trigger a new deployment automatically if:
- Auto-deploy is enabled in Vercel settings
- Build succeeds without errors

Manual deployment:
1. Go to Vercel Dashboard
2. Click "Redeploy" on latest deployment

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied in Supabase
- [ ] Build completes successfully
- [ ] API endpoints responding correctly
- [ ] Frontend loads without errors
- [ ] CSS/JS files loading (no 404s)
- [ ] tRPC queries working
- [ ] Database indexes created for performance

## Support

If you encounter issues:
1. Check Vercel function logs
2. Check Supabase logs
3. Review browser console
4. Verify environment variables are set correctly


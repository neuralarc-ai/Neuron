# Vercel Deployment Guide for Neuron HRMS

## Required Environment Variables

Set these in your Vercel project settings:

### Required Variables:
- `NODE_ENV` = `production`
- `JWT_SECRET` = `your-secure-jwt-secret-key-here` (generate a random string)

### Optional Variables (will use mock data if not set):
- `DATABASE_URL` = `mysql://username:password@host:port/database`
- `VITE_APP_TITLE` = `Neuron HRMS`
- `VITE_APP_ID` = `neuron-hrms`

### PIN Authentication:
The PIN `147812` is hardcoded in the application and doesn't require any environment variables.

## Deployment Steps:

1. **Push your code** to GitHub/GitLab
2. **Connect to Vercel** and import your repository
3. **Set environment variables** in Vercel dashboard
4. **Deploy** - Vercel will automatically build and deploy

## Important Notes:

- The application will work with mock data if no database is configured
- PIN authentication (`147812`) will work immediately
- All API endpoints will return sample data for testing
- The build process is optimized for Vercel's serverless architecture

## Troubleshooting:

If you see errors after deployment:
1. Check that all required environment variables are set
2. Ensure `NODE_ENV=production` is set
3. Check Vercel function logs for specific error messages
4. The application should work with mock data even without a database

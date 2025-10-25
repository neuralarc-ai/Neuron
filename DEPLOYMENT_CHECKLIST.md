# Vercel Deployment Checklist - Supabase Ready

## ✅ **Pre-Deployment Checklist**

### **1. Code Changes Complete**
- ✅ **Database Migration**: MySQL → Supabase PostgreSQL
- ✅ **Schema Updated**: All tables converted to PostgreSQL syntax
- ✅ **Dependencies Updated**: `mysql2` → `postgres` package
- ✅ **API Handler**: Production-ready tRPC handler restored
- ✅ **Mock Data Removed**: Clean database ready for real data
- ✅ **Foreign Keys Added**: Data integrity constraints in place

### **2. Environment Variables Required**

**Set these in Vercel Dashboard → Settings → Environment Variables:**

```env
# REQUIRED - Database Connection
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# REQUIRED - Application Settings
NODE_ENV=production
JWT_SECRET=[Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]

# OPTIONAL - App Configuration
VITE_APP_TITLE=Neuron HRMS
VITE_APP_ID=neuron-hrms
```

### **3. Supabase Setup Required**

**Before deploying, complete these steps:**

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your database password and project reference

2. **Run Migration Script**
   - Go to Supabase Dashboard → SQL Editor
   - Copy contents of `supabase-migration.sql`
   - Paste and run the migration
   - Verify all tables are created

3. **Get Connection String**
   - Go to Settings → Database
   - Copy the connection string
   - Use it as your `DATABASE_URL`

### **4. Vercel Configuration**

**Current `vercel.json` is correct:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    },
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🚀 **Deployment Steps**

### **Step 1: Set Up Supabase**
```bash
# 1. Create Supabase project at supabase.com
# 2. Run the migration script in SQL Editor
# 3. Get your connection string
```

### **Step 2: Configure Vercel**
```bash
# 1. Go to Vercel Dashboard
# 2. Navigate to your project
# 3. Go to Settings → Environment Variables
# 4. Add all required environment variables
```

### **Step 3: Deploy**
```bash
# Option 1: Git-based deployment
git add .
git commit -m "Migrate to Supabase"
git push origin main

# Option 2: Manual deployment
vercel --prod
```

## ✅ **Post-Deployment Verification**

### **1. Check Health Endpoint**
```bash
curl https://your-app.vercel.app/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### **2. Check Database Connection**
- Go to Vercel Dashboard → Functions
- Check function logs for: `[Database] Successfully connected to Supabase`

### **3. Test Core Functionality**
- ✅ Dashboard loads with statistics
- ✅ Employees page loads (empty initially)
- ✅ Employee creation works
- ✅ All CRUD operations function

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **500 Errors**
   - Check `DATABASE_URL` format
   - Verify Supabase project is active
   - Check Vercel function logs

2. **Database Connection Failed**
   - Verify password in connection string
   - Check Supabase project status
   - Ensure migration script ran successfully

3. **Build Failures**
   - Check `package.json` dependencies
   - Verify all imports are correct
   - Check for TypeScript errors

### **Debug Commands:**
```bash
# Check build locally
npm run build

# Test database connection
npm run dev

# Check TypeScript errors
npm run check
```

## 🎯 **Expected Results**

After successful deployment:
- ✅ **No 500 errors** - Supabase connection works perfectly
- ✅ **Fast loading** - PostgreSQL is more efficient than MySQL
- ✅ **Real-time data** - All CRUD operations work with real database
- ✅ **Scalable** - Supabase handles connection pooling automatically
- ✅ **Secure** - Row Level Security policies in place

## 📋 **Final Checklist**

- [ ] Supabase project created
- [ ] Migration script executed
- [ ] Environment variables set in Vercel
- [ ] Code deployed to Vercel
- [ ] Health endpoint responding
- [ ] Database connection successful
- [ ] Core functionality tested

**Your HRMS application is now ready for production deployment with Supabase!** 🚀

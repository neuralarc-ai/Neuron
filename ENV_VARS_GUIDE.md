# Environment Variables Guide

## 🚀 **For the Bulletproof Handler (Current)**

**NO ENVIRONMENT VARIABLES NEEDED!**

The current bulletproof handler works without any environment variables because it:
- Returns static data (no database connection)
- Uses built-in Web APIs only
- No external dependencies

## 🔧 **For Full Functionality (After Basic Handler Works)**

### **Required Environment Variables:**

```env
# Database Connection (REQUIRED for real data)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Application Environment (REQUIRED)
NODE_ENV=production

# JWT Secret for Authentication (REQUIRED)
JWT_SECRET=[Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
```

### **Optional Environment Variables:**

```env
# App Configuration (OPTIONAL)
VITE_APP_TITLE=Neuron HRMS
VITE_APP_ID=neuron-hrms
```

## 📋 **Step-by-Step Setup**

### **Phase 1: Deploy Bulletproof Handler (NOW)**
```bash
# No environment variables needed
git add .
git commit -m "Fix: Bulletproof API handler"
git push origin main
```

### **Phase 2: Add Supabase (After Basic Handler Works)**

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your database password and project reference

2. **Run Migration Script:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy contents of `supabase-migration.sql`
   - Paste and run the migration

3. **Get Connection String:**
   - Go to Settings → Database
   - Copy the connection string
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

4. **Set Environment Variables in Vercel:**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@db.your_project_ref.supabase.co:5432/postgres
   NODE_ENV=production
   JWT_SECRET=your_generated_secret_here
   ```

## 🎯 **Current Status**

**Right now, you can deploy with ZERO environment variables!**

The bulletproof handler will:
- ✅ Work immediately
- ✅ Return static data
- ✅ Fix all 500 errors
- ✅ Show detailed logs

## 🔄 **Migration Path**

1. **Deploy bulletproof handler** (no env vars needed)
2. **Verify it works** (no 500 errors)
3. **Add Supabase** (set up DATABASE_URL)
4. **Update handler** (add database integration)
5. **Deploy with real data**

## ⚡ **Quick Deploy Command**

```bash
# Deploy now with no environment variables
git add .
git commit -m "Deploy bulletproof handler"
git push origin main
```

**The bulletproof handler is designed to work immediately without any configuration!** 🚀

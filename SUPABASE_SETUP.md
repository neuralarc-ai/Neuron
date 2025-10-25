# Supabase Setup Guide for Neuron HRMS

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `neuron-hrms`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

## Step 2: Get Connection Details

1. Go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Copy the **URI** connection string
4. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## Step 3: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-migration.sql` from this project
3. Paste it into the SQL Editor
4. Click **Run** to execute the migration
5. This will create all tables, indexes, and sample data

## Step 4: Configure Environment Variables

### For Local Development:
Create/update your `.env` file:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
NODE_ENV=development
```

### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add/Update:
   - `DATABASE_URL` = `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - `NODE_ENV` = `production`

## Step 5: Install Dependencies

Run this command to install the PostgreSQL driver:
```bash
npm install postgres
```

## Step 6: Test the Connection

1. Deploy your updated code to Vercel
2. Check the Vercel function logs to see:
   ```
   [Database] Attempting to connect to Supabase...
   [Database] Successfully connected to Supabase
   ```

## Benefits of Supabase over MySQL:

✅ **Better Vercel Integration**: Supabase is optimized for serverless functions
✅ **Built-in Connection Pooling**: Handles connections automatically
✅ **Real-time Features**: Can add real-time updates later
✅ **Better Performance**: PostgreSQL is more efficient for complex queries
✅ **Row Level Security**: Built-in security policies
✅ **Automatic Backups**: Supabase handles backups automatically
✅ **Scalability**: Automatically scales with your usage

## Troubleshooting:

### Connection Issues:
- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure the password in the connection string matches your database password

### Migration Issues:
- Make sure you're running the SQL in the Supabase SQL Editor
- Check for any syntax errors in the migration script
- Verify all tables were created successfully

### Performance:
- Supabase automatically handles connection pooling
- No need to manage connection limits like with traditional databases
- Built-in caching and optimization

## Next Steps:

1. **Test all functionality** with the new Supabase database
2. **Verify data persistence** across deployments
3. **Check performance** - should be faster than MySQL
4. **Consider adding real-time features** using Supabase's real-time capabilities

Your HRMS system will now work seamlessly with Vercel's serverless functions!

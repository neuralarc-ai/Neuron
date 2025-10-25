# Environment Variables Setup for Supabase

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Database Connection (REQUIRED)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Application Environment (REQUIRED)
NODE_ENV=development

# JWT Secret for Authentication (REQUIRED)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Optional App Settings
VITE_APP_TITLE=Neuron HRMS
VITE_APP_ID=neuron-hrms
```

## Step-by-Step Setup

### 1. Create .env File
```bash
# In your project root directory
touch .env
```

### 2. Get Supabase Connection String
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection string**
4. Copy the **URI** connection string
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Replace `[PROJECT-REF]` with your actual project reference

### 3. Generate JWT Secret
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Update .env File
Replace the placeholder values in your `.env` file:

```env
# Example with actual values (replace with your actual values)
DATABASE_URL=postgresql://postgres:your_actual_password@db.abcdefghijklmnop.supabase.co:5432/postgres
NODE_ENV=development
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
VITE_APP_TITLE=Neuron HRMS
VITE_APP_ID=neuron-hrms
```

## For Vercel Deployment

### 1. Go to Vercel Dashboard
1. Navigate to your project
2. Go to **Settings** → **Environment Variables**

### 2. Add Environment Variables
Add each variable with your actual values:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `[Generated secure secret]` |
| `VITE_APP_TITLE` | `Neuron HRMS` |
| `VITE_APP_ID` | `neuron-hrms` |

## Verification

### Local Development
```bash
# Start development server
npm run dev

# Check console for database connection logs
# Should see: [Database] Successfully connected to Supabase
```

### Vercel Deployment
1. Deploy your project
2. Check Vercel function logs
3. Look for successful database connection messages

## Important Notes

- **Never commit .env files** to version control
- **Use different JWT secrets** for development and production
- **Keep your database password secure**
- **Test locally** before deploying to production

## Troubleshooting

### Connection Issues
- Verify DATABASE_URL format is correct
- Check that your Supabase project is active
- Ensure password in connection string matches your database password

### Authentication Issues
- Verify JWT_SECRET is set and is a long random string
- Check that NODE_ENV is set correctly

### Environment Variable Not Loading
- Ensure .env file is in project root
- Restart your development server after changes
- Check for typos in variable names

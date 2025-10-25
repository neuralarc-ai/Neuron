# Simple Vite App Environment Variables

## Required Environment Variables

Create a `.env` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration (Optional)
VITE_APP_TITLE=Neuron HRMS
VITE_APP_ID=neuron-hrms
```

## How to Get Supabase Credentials

1. **Go to your Supabase project dashboard**
2. **Go to Settings → API**
3. **Copy the following:**
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public key** → Use as `VITE_SUPABASE_ANON_KEY`

## Example .env File

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2MDAwMCwiZXhwIjoyMDE0MzM2MDAwfQ.example-key-here
VITE_APP_TITLE=Neuron HRMS
VITE_APP_ID=neuron-hrms
```

## For Vercel Deployment

Add these environment variables in Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_TITLE`
- `VITE_APP_ID`

## Benefits of This Approach

- ✅ **No Complex tRPC** - Direct Supabase calls
- ✅ **No Server Dependencies** - Pure client-side
- ✅ **Real-time Updates** - Supabase real-time features
- ✅ **Simple Deployment** - Just static files
- ✅ **Better Performance** - Direct database connection
- ✅ **Easier Debugging** - Simple API calls

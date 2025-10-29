import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client for server-side operations
 * Uses SUPABASE_URL and SUPABASE_KEY (service role key) from environment
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Get Supabase URL and key (check both server-side and VITE_ prefixed versions)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY 
    || process.env.SUPABASE_SERVICE_ROLE_KEY 
    || process.env.SUPABASE_SECRET_KEY
    || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    || process.env.VITE_SUPABASE_SECRET_KEY;

  // Debug logging
  console.log(`[Supabase] Checking environment variables...`);
  console.log(`[Supabase] SUPABASE_URL exists: ${!!supabaseUrl}`);
  console.log(`[Supabase] SUPABASE_URL value: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET'}`);
  console.log(`[Supabase] VITE_SUPABASE_URL exists: ${!!process.env.VITE_SUPABASE_URL}`);
  console.log(`[Supabase] SUPABASE_KEY exists: ${!!process.env.SUPABASE_KEY}`);
  console.log(`[Supabase] SUPABASE_SERVICE_ROLE_KEY exists: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  console.log(`[Supabase] SUPABASE_SECRET_KEY exists: ${!!process.env.SUPABASE_SECRET_KEY}`);
  console.log(`[Supabase] VITE_SUPABASE_SERVICE_ROLE_KEY exists: ${!!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`);
  console.log(`[Supabase] VITE_SUPABASE_SECRET_KEY exists: ${!!process.env.VITE_SUPABASE_SECRET_KEY}`);
  console.log(`[Supabase] Final key used: ${supabaseKey ? 'FOUND (' + supabaseKey.substring(0, 20) + '...)' : 'NOT FOUND'}`);

  if (!supabaseUrl || !supabaseKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseKey) missing.push('SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_SECRET_KEY');
    
    console.error(`[Supabase] ❌ Missing environment variables: ${missing.join(', ')}`);
    console.error(`[Supabase] Please set these in your .env file.`);
    console.error(`[Supabase] Get them from: Supabase Dashboard → Settings → API`);
    console.error(`[Supabase] Make sure you're using the SERVICE_ROLE key (secret) for server-side operations`);
    
    throw new Error(`Supabase client not configured. Missing: ${missing.join(', ')}. Please check your .env file.`);
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });

    console.log(`[Supabase] ✅ Client initialized successfully`);
    console.log(`[Supabase] URL: ${supabaseUrl}`);
    return supabaseClient;
  } catch (error) {
    console.error(`[Supabase] ❌ Failed to create Supabase client:`, error);
    throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reset the Supabase client (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}


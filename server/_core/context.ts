import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getSupabaseClient } from "../supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"] | Request;
  res: CreateExpressContextOptions["res"] | undefined;
  user: User | null;
  userId: number | null;
  supabase: SupabaseClient;
};

export async function createContext(
  opts: CreateExpressContextOptions | { req: Request; res?: undefined }
): Promise<TrpcContext> {
  let user: User | null = null;
  let userId: number | null = null;

  // Handle both Express (local dev) and Vercel Fetch API
  const req = opts.req as any;
  const res = (opts as CreateExpressContextOptions).res;

  // Simple session-based authentication (only works with Express)
  if (req.session && req.session.user) {
    user = req.session.user;
    userId = user.id;
  }

  // Get Supabase client from header or session
  // Extract user ID from Authorization header if available
  const authHeader = req.headers?.authorization || 
                     (req.headers?.get ? req.headers.get('authorization') : null);
  if (authHeader && !userId) {
    // If using JWT, extract user ID from token
    // For now, we'll use session-based auth primarily
  }

  const supabase = getSupabaseClient();

  return {
    req,
    res,
    user,
    userId,
    supabase,
  };
}


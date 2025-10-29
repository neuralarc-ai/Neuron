import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getSupabaseClient } from "../supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  userId: number | null;
  supabase: SupabaseClient;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let userId: number | null = null;

  // Simple session-based authentication
  const session = (opts.req as any).session;
  if (session && session.user) {
    user = session.user;
    userId = user.id;
  }

  // Get Supabase client from header or session
  // Extract user ID from Authorization header if available
  const authHeader = opts.req.headers.authorization;
  if (authHeader && !userId) {
    // If using JWT, extract user ID from token
    // For now, we'll use session-based auth primarily
  }

  const supabase = getSupabaseClient();

  return {
    req: opts.req,
    res: opts.res,
    user,
    userId,
    supabase,
  };
}


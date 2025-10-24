import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Simple session-based authentication
  const session = (opts.req as any).session;
  if (session && session.user) {
    user = session.user;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}


import "express-session";
import type { AuthUser } from "../../drizzle/schema";

declare module "express-session" {
  interface SessionData {
    user?: AuthUser;
  }
}


import { eq } from "drizzle-orm";
import { authUsers, type AuthUser, type InsertAuthUser } from "../drizzle/schema";
import { getDb } from "./db";
import bcrypt from "bcryptjs";

export async function createAuthUser(data: Omit<InsertAuthUser, "password"> & { password: string }): Promise<AuthUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [user] = await db.insert(authUsers).values({
    ...data,
    password: hashedPassword,
  }).returning();

  if (!user) throw new Error("Failed to create user");
  
  return user;
}

export async function getAuthUserById(id: number): Promise<AuthUser | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(authUsers).where(eq(authUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAuthUserByUsername(username: string): Promise<AuthUser | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(authUsers).where(eq(authUsers.username, username)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllAuthUsers(): Promise<AuthUser[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(authUsers);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function updateLastLogin(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(authUsers)
    .set({ lastLogin: new Date() })
    .where(eq(authUsers.id, userId));
}

export async function deleteAuthUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(authUsers).where(eq(authUsers.id, id));
}

export async function initializeDefaultAdmin(): Promise<void> {
  const existing = await getAuthUserByUsername("admin");
  if (existing) return;

  await createAuthUser({
    username: "admin",
    password: "admin",
    name: "Administrator",
    role: "admin",
  });
}


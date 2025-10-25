import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { authUsers } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);
  
  // Hash the password
  const hashedPassword = await bcrypt.hash("admin", 10);
  
  // Check if admin already exists
  const existing = await db.select().from(authUsers).where(eq(authUsers.username, "admin")).limit(1);
  
  if (existing.length > 0) {
    console.log("Admin user already exists");
    return;
  }
  
  // Create admin user
  await db.insert(authUsers).values({
    username: "admin",
    password: hashedPassword,
    name: "Administrator",
    role: "admin",
  });
  
  console.log("Admin user created successfully");
  console.log("Username: admin");
  console.log("Password: admin");
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding admin:", error);
    process.exit(1);
  });


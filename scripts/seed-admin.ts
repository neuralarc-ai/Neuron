import { drizzle } from "drizzle-orm/mysql2";
import { authUsers } from "../drizzle/schema";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  const db = drizzle(process.env.DATABASE_URL!);
  
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

import { eq } from "drizzle-orm";

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding admin:", error);
    process.exit(1);
  });


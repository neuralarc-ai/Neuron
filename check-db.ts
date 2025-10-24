import { getDb } from './server/db';
import { authUsers } from './drizzle/schema';

async function check() {
  const db = await getDb();
  if (!db) {
    console.log('Database not available');
    return;
  }
  
  const users = await db.select().from(authUsers);
  console.log('Auth users:', JSON.stringify(users, null, 2));
}

check().catch(console.error).finally(() => process.exit(0));

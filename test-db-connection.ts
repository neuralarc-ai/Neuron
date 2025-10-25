import { getDb } from './server/db.js';

async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    const db = await getDb();
    if (db) {
      console.log('✅ Database connection successful!');
      
      // Test a simple query
      const result = await db.execute('SELECT 1 as test');
      console.log('✅ Database query test successful:', result);
    } else {
      console.log('❌ Database connection failed - db is null');
    }
  } catch (error) {
    console.log('❌ Database connection error:', error);
  }
}

testConnection().catch(console.error);

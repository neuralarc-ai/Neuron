import { getAuthUserByUsername } from './server/authDb';
import bcrypt from 'bcryptjs';

async function test() {
  const user = await getAuthUserByUsername('admin');
  console.log('User found:', user ? 'YES' : 'NO');
  
  if (user) {
    console.log('Username:', user.username);
    console.log('Hashed password:', user.password);
    
    const isValid = await bcrypt.compare('admin', user.password);
    console.log('Password valid:', isValid);
  }
}

test().catch(console.error);

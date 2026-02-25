import pg from 'pg';
import 'dotenv/config';

async function testConnection() {
  console.log('🔗 Testing Database Connection...');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connection Successful! Server time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();

import pg from 'pg';
import 'dotenv/config';

async function checkDB() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT enum_range(NULL::\"UserState\")");
    console.log('UserState Enum Range:', res.rows[0].enum_range);
    
    const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'pendingPackageId'");
    console.log('User.pendingPackageId column exists:', res2.rows.length > 0);
  } catch (err) {
    console.error('DB Check Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkDB();

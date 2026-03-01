import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const packages = [
    ['p1', 'Starter', 1, 50, true],
    ['p2', 'Standard', 12, 500, true],
    ['p3', 'Pro', 40, 1400, true]
  ];

  console.log("Directly seeding packages...");
  
  try {
    for (const pkg of packages) {
      await pool.query(
        `INSERT INTO "CreditPackage" (id, name, credits, "priceETB", active) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id) DO UPDATE 
         SET name = $2, credits = $3, "priceETB" = $4, active = $5`,
        pkg
      );
      console.log(`✅ Synced: ${pkg[1]}`);
    }
  } catch (err) {
    console.error("❌ SQL Error:", err);
  } finally {
    await pool.end();
  }
}

seed();

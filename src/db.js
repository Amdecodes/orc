import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('[DB] CRITICAL: DATABASE_URL is not defined in environment.');
}

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false // Explicitly disable SSL for local development if not needed
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;

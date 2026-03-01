import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const requests = await prisma.topUpRequest.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log("--- LATEST TOPUP REQUESTS ---");
    requests.forEach(r => {
      console.log(`ID: ${r.id} | User: ${r.user.email} | Credits: ${r.credits} | Status: ${r.status} | User DB Credits: ${r.user.credits}`);
    });

    const users = await prisma.user.findMany({
      select: { email: true, credits: true },
      take: 5
    });
    console.log("\n--- USER CREDITS ---");
    users.forEach(u => console.log(`${u.email}: ${u.credits}`));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();

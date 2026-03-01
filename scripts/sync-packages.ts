import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const packages = [
    { id: "p1", name: "Starter", credits: 1, priceETB: 50 },
    { id: "p2", name: "Standard", credits: 12, priceETB: 500 },
    { id: "p3", name: "Pro", credits: 40, priceETB: 1400 },
  ];

  console.log("Syncing packages...");

  for (const pkg of packages) {
    await prisma.creditPackage.upsert({
      where: { id: pkg.id },
      update: pkg,
      create: pkg,
    });
    console.log(`✅ Upserted package: ${pkg.name} (${pkg.id})`);
  }

  const allInDb = await prisma.creditPackage.findMany();
  console.log("Current Packages in DB:", JSON.stringify(allInDb, null, 2));
}

main()
  .catch((e) => {
    console.error("❌ Sync failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

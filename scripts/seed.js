import { prisma } from '../src/db/prisma.js';

async function seed() {
  console.log('Seeding Credit Packages...');
  const packages = [
    { name: '5 Credits', credits: 5, priceETB: 100 },
    { name: '10 Credits', credits: 10, priceETB: 180 },
    { name: '25 Credits', credits: 25, priceETB: 400 },
  ];

  for (const pkg of packages) {
    // findFirst might be safer if we don't have a unique name index yet
    const existing = await prisma.creditPackage.findFirst({
      where: { name: pkg.name }
    });
    
    if (!existing) {
      await prisma.creditPackage.create({ data: pkg });
      console.log(`Created package: ${pkg.name}`);
    } else {
      console.log(`Package already exists: ${pkg.name}`);
    }
  }
  
  console.log('Seeding Admin User...');
  const adminTelegramId = '6933555230';
  await prisma.user.upsert({
    where: { telegramId: adminTelegramId },
    update: { role: 'ADMIN' },
    create: {
      telegramId: adminTelegramId,
      username: 'admin',
      role: 'ADMIN',
      credits: 999,
      state: 'IDLE'
    }
  });

  console.log('Seed completed.');
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});

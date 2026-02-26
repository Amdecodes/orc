import { prisma } from './src/db/prisma.js';
import { refundForJob } from './src/services/credits.service.js';

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    console.log(`Checking user: ${user.username} (Credits: ${user.credits})`);
    const jobs = await prisma.job.findMany({
      where: { userId: user.id, status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    for (const job of jobs) {
      try {
        console.log(`Refunding job: ${job.id}`);
        await refundForJob(job.id);
      } catch (e) {
        console.log(`Skip job ${job.id}: ${e.message}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

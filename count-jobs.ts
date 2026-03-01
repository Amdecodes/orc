// count-jobs.ts
import { PrismaClient } from "./prisma/generated-client";
const prisma = new PrismaClient();
async function main() {
  const counts = await prisma.job.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log(JSON.stringify(counts, null, 2));
}
main().catch(err => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());

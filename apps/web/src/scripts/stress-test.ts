// apps/web/src/scripts/stress-test.ts
import prisma from "../lib/prisma";
import { processJob } from "../lib/jobs";
import path from "path";

/**
 * Stress Test Script
 * Simulates multiple concurrent jobs and measures processing capacity.
 */
async function runStressTest(concurrency: number = 5) {
  console.log(`🔥 Starting Stress Test with ${concurrency} concurrent jobs...`);
  
  // 1. Get a real user to associate jobs with
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("❌ No users found in database to run test.");
    return;
  }

  // 2. Prepare dummy paths (we expect these to fail gracefully or we point to real files if available)
  // For a real stress test, we should ideally have a set of valid test images.
  const dummyFront = "/tmp/stress_front.jpg";
  const dummyBack = "/tmp/stress_back.jpg";
  const dummyPhoto = "/tmp/stress_photo.jpg";

  console.log("📝 Creating test jobs...");
  const jobIds: string[] = [];
  
  for (let i = 0; i < concurrency; i++) {
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        status: "PENDING",
        cost: 0, // No cost for stress test
        frontImagePath: dummyFront,
        backImagePath: dummyBack,
        photoPath: dummyPhoto,
      }
    });
    jobIds.push(job.id);
  }

  console.log(`✅ Created ${concurrency} PENDING jobs.`);
  console.log("⏱️  Monitoring worker through database...");

  const startTime = Date.now();
  let completedCount = 0;

  while (completedCount < concurrency) {
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: jobIds },
        status: { in: ["SUCCESS", "FAILED"] }
      }
    });

    completedCount = jobs.length;
    
    if (completedCount < concurrency) {
      process.stdout.write(`\rProgress: ${completedCount}/${concurrency} jobs completed...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const endTime = Date.now();
  const totalTimeSec = (endTime - startTime) / 1000;
  
  console.log("\n\n--- 📊 STRESS TEST RESULTS ---");
  console.log(`Total Jobs: ${concurrency}`);
  console.log(`Total Time: ${totalTimeSec.toFixed(2)} seconds`);
  console.log(`Average Time per Job: ${(totalTimeSec / concurrency).toFixed(2)} seconds`);
  console.log(`Throughput: ${(concurrency / (totalTimeSec / 60)).toFixed(2)} jobs/minute`);
  console.log("------------------------------\n");
}

const args = process.argv.slice(2);
const count = parseInt(args[0]) || 5;

runStressTest(count).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});

import fs from "fs";
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

  // 2. Prepare real paths
  const srcFront = "/home/amde/Documents/et-id-ocr-test/test img/photo_3_2026-02-27_00-06-59.jpg";
  const srcBack = "/home/amde/Documents/et-id-ocr-test/test img/photo_2_2026-02-27_00-06-59.jpg";
  const srcPhoto = "/home/amde/Documents/et-id-ocr-test/test img/photo_1_2026-02-27_00-06-59.jpg";

  if (!fs.existsSync(srcFront) || !fs.existsSync(srcBack) || !fs.existsSync(srcPhoto)) {
    console.error("❌ Source images not found!");
    return;
  }

  console.log("📝 Creating test jobs with REAL images...");
  const jobIds: string[] = [];
  
  for (let i = 0; i < concurrency; i++) {
    // Copy images so the worker can safely process/delete them without affecting the originals
    const frontPath = `/tmp/stress_front_${Date.now()}_${i}.jpg`;
    const backPath = `/tmp/stress_back_${Date.now()}_${i}.jpg`;
    const photoPath = `/tmp/stress_photo_${Date.now()}_${i}.jpg`;
    
    fs.copyFileSync(srcFront, frontPath);
    fs.copyFileSync(srcBack, backPath);
    fs.copyFileSync(srcPhoto, photoPath);

    const job = await prisma.job.create({
      data: {
        userId: user.id,
        status: "PENDING",
        cost: 0, // No cost for stress test
        frontImagePath: frontPath,
        backImagePath: backPath,
        photoPath: photoPath,
      }
    });
    jobIds.push(job.id);
  }

  console.log(`✅ Created ${concurrency} PENDING jobs.`);
  console.log("⏱️  Monitoring worker through database (this may take a while)...");

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

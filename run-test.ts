console.log("Loading modules...");
import "dotenv/config";
import { processJob } from "./apps/web/src/lib/jobs";
import prisma from "./apps/web/src/lib/prisma";
import fs from "fs";

async function runRealTest() {
  console.log("🔥 Starting Real AI Render Benchmark for Ethiopian ID OCR...");
  const user = await prisma.user.findFirst();
  if (!user) return console.log("❌ No user found.");

  const srcFront = "/home/amde/Documents/et-id-ocr-test/test img/photo_3_2026-02-27_00-06-59.jpg";
  const srcBack = "/home/amde/Documents/et-id-ocr-test/test img/photo_2_2026-02-27_00-06-59.jpg";
  const srcPhoto = "/home/amde/Documents/et-id-ocr-test/test img/photo_1_2026-02-27_00-06-59.jpg";

  const frontPath = `/tmp/bench_front.jpg`;
  const backPath = `/tmp/bench_back.jpg`;
  const photoPath = `/tmp/bench_photo.jpg`;
  fs.copyFileSync(srcFront, frontPath);
  fs.copyFileSync(srcBack, backPath);
  fs.copyFileSync(srcPhoto, photoPath);

  const testJob = await prisma.job.create({
    data: { userId: user.id, status: "PROCESSING", cost: 0, frontImagePath: frontPath, backImagePath: backPath, photoPath: photoPath }
  });

  const startTime = Date.now();
  console.log(`⏱️ Artificial Queue Bypassed. Direct CPU execution started at ${new Date().toISOString()}`);

  try {
    await processJob(testJob.id, testJob.userId, frontPath, backPath, photoPath);
    const endTime = Date.now();
    const durationSec = (endTime - startTime) / 1000;
    
    console.log("✅ Rendering Completed Successfully!");
    console.log(`📊 TOTAL CPU/AI PROCESSING TIME: ${durationSec.toFixed(2)} seconds directly.`);
    console.log(`With a Concurrency of 5, the server processes 5 of these every ~${durationSec.toFixed(0)}s.`);
  } catch (error) {
    console.error("❌ Test crashed:", error);
  }
}

runRealTest().then(() => process.exit(0)).catch(() => process.exit(1));

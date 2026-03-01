console.log("--- WORKER FILE LOADED ---");
import prisma from "../lib/prisma";
import { processJob } from "../lib/jobs";
import { unlink } from "fs/promises";
import fs from "fs";

/**
 * A simple background worker that polls the prisma database for PENDING jobs.
 * Supports parallel processing.
 */
const MAX_CONCURRENT_JOBS = 5; // Handle up to 5 IDs at the exact same time
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Check for old files every 1 hour
let activeJobs = 0;

/**
 * Automatically deletes generated ID files older than 48 hours to save disk space.
 */
async function cleanupOldFiles() {
  console.log("🧹 [Cleanup] Running automated 48-hour cleanup...");
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    // Find jobs that are older than 48 hours and have an outputPath
    const oldJobs = await prisma.job.findMany({
      where: {
        createdAt: { lt: fortyEightHoursAgo },
        outputPath: { not: null },
        status: "SUCCESS" // Only cleanup successful jobs that actually have files
      }
    });

    console.log(`🧹 [Cleanup] Found ${oldJobs.length} potential files to remove.`);

    for (const job of oldJobs) {
      if (job.outputPath && fs.existsSync(job.outputPath)) {
        await unlink(job.outputPath).catch(err => console.error(`[Cleanup] Failed to delete ${job.outputPath}`, err));
        
        // Update DB to reflect file is gone (optional but good practice)
        await prisma.job.update({
          where: { id: job.id },
          data: { outputPath: null } 
        });
      }
    }
    console.log("🧹 [Cleanup] Routine finished.");
  } catch (err) {
    console.error("❌ [Cleanup] Error in cleanup routine:", err);
  }
}

async function startWorker() {
  console.log("🚀 ID Engine Background Worker is starting...");
  console.log("DB_URL Check:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  console.log("BOT_SECRET Check:", process.env.BOT_SECRET ? "SET" : "NOT SET");
  console.log(`Concurrency Limit: ${MAX_CONCURRENT_JOBS}`);

  // Run initial cleanup
  cleanupOldFiles();
  // Schedule cleanup
  setInterval(cleanupOldFiles, CLEANUP_INTERVAL_MS);
  
  while (true) {
    try {
      if (activeJobs >= MAX_CONCURRENT_JOBS) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      // 1. Peek for a PENDING job
      const nextJob = await prisma.job.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" }
      });

      if (nextJob) {
        // 2. Lock the job to PROCESSING
        const lockedJob = await prisma.job.update({
          where: { id: nextJob.id, status: "PENDING" },
          data: { status: "PROCESSING" }
        }).catch(() => null);

        if (!lockedJob) continue;

        activeJobs++;
        console.log(`[Worker] Starting job ${lockedJob.id} (${activeJobs}/${MAX_CONCURRENT_JOBS} active)`);

        // Process asynchronously
        processJob(
            lockedJob.id, 
            lockedJob.userId, 
            lockedJob.frontImagePath!, 
            lockedJob.backImagePath!, 
            lockedJob.photoPath!
        ).then(() => {
            activeJobs--;
            console.log(`[Worker] Finished job ${lockedJob.id} (${activeJobs}/${MAX_CONCURRENT_JOBS} active)`);
        }).catch(err => {
            activeJobs--;
            console.error(`[Worker] Error in job ${lockedJob.id}:`, err);
        });

      } else {
        // No jobs? Rest.
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("❌ [Worker] Loop Error:", error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Ensure the process doesn't exit immediately
process.on("uncaughtException", (err) => {
  console.error("CRITICAL: Uncaught Exception in worker", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});

startWorker();

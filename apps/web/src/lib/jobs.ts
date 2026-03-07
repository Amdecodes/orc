import prisma from "./prisma";
import { generateID } from "@et-id-ocr/id-engine";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "./upload";
import { encryptBuffer } from "./crypto";

export async function processJob(jobId: string, userId: string, frontPath: string, backPath: string, photoPath: string) {
  let status: "SUCCESS" | "FAILED" = "FAILED";
  let user: any = null;
  let errorCode = "INTERNAL_ERROR";
  let errorMessage = "An internal system error occurred. We have not deducted your credit. Please try again later.";

  try {
    // 0. Get user for telegramId
    user = await prisma.user.findUnique({ where: { id: userId } });

    // 1. Read files
    const frontBuffer = await readFile(frontPath).catch(() => null);
    const backBuffer = await readFile(backPath).catch(() => null);
    const thirdBuffer = await readFile(photoPath).catch(() => null);

    if (!frontBuffer || !backBuffer || !thirdBuffer) {
        throw new Error("Could not read input files");
    }

    // 2. Generate ID
    const { image, format } = await generateID(frontBuffer, backBuffer, thirdBuffer);
    
    // Save output to disk
    const userDir = path.join(UPLOAD_DIR, userId, "output");
    await mkdir(userDir, { recursive: true });
    
    const outputFileName = `id-${jobId}.${format}.enc`;
    const outputPath = path.join(userDir, outputFileName);
    const encryptedImage = encryptBuffer(image);
    await writeFile(outputPath, encryptedImage);

    // 3. Deduct Credits & Update Job (Transaction)
    await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: { 
          status: "SUCCESS", 
          outputPath: outputPath,
          output: `/api/jobs/download/${jobId}`
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: "DEDUCT",
          amount: 1,
          jobId: jobId,
        }
      })
    ]);
    
    status = "SUCCESS";
  } catch (error: any) {
    console.error(`Processing failed for job ${jobId}:`, error);
    
    // Determine Error Code and if User Error
    let isUserError = false;

    if (error.name === 'IdentityExtractionError') {
      if (error.code === 'INVALID_INPUT') {
        errorCode = "VALIDATION_ERROR";
        errorMessage = "Invalid image files provided.";
        isUserError = true;
      } else {
        errorCode = "IMAGE_UNREADABLE";
        errorMessage = "The ID is too blurry, cuts off edges, or could not be clearly read. Please ensure good lighting and focus.";
        isUserError = true;
      }
    }

    if (isUserError) {
      // User Error: We still deduct the credit because they used system resources successfully but uploaded bad images.
      await prisma.$transaction([
        prisma.job.update({
          where: { id: jobId },
          data: { status: "FAILED", errorCode, errorMessage }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { credits: { decrement: 1 } }
        }),
        prisma.transaction.create({
          data: { userId, type: "DEDUCT", amount: 1, jobId }
        })
      ]);
    } else {
      // System Error: We do NOT deduct the credit (which acts as a refund since deduction hasn't happened yet)
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "FAILED", errorCode, errorMessage },
      });
    }

    status = "FAILED";
  } finally {
    // ALWAYS clean up input files (even on failure) to protect user privacy
    const exists = (p: string) => fs.existsSync(p);
    await Promise.allSettled([
      frontPath && exists(frontPath) ? unlink(frontPath) : Promise.resolve(),
      backPath && exists(backPath) ? unlink(backPath) : Promise.resolve(),
      photoPath && exists(photoPath) ? unlink(photoPath) : Promise.resolve()
    ]);
    // Notify Bot via Webhook
    if (user?.telegramId) {
        try {
            const botBaseUrl = process.env.BOT_INTERNAL_URL || "http://localhost:5005";
            const botUrl = `${botBaseUrl}/notify-job`;
            console.log(`[Worker] Notifying bot at ${botUrl} for job ${jobId}, status: ${status}`);
            const response = await fetch(botUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-bot-secret": process.env.BOT_SECRET || ""
                },
                body: JSON.stringify({
                    telegramId: String(user.telegramId),
                    jobId: jobId,
                    status: status,
                    errorCode: errorCode,
                    errorMessage: errorMessage
                })
            });
            console.log(`[Worker] Bot notification response: ${response.status} ${response.statusText}`);
        } catch (notifyErr) {
            console.error("Failed to notify bot for job", jobId, notifyErr);
        }
    }
  }
}

/**
 * Calculates the current queue position and estimated wait time for a given job.
 */
export async function getQueueMetrics(jobId: string) {
  const currentJob = await prisma.job.findUnique({
    where: { id: jobId },
    select: { createdAt: true, status: true }
  });

  if (!currentJob) return null;

  // Active workers processing right now
  const activeCount = await prisma.job.count({
    where: { status: "PROCESSING" }
  });

  // Jobs that were added to the queue BEFORE this job
  const aheadInQueue = await prisma.job.count({
    where: {
      status: "PENDING",
      createdAt: { lt: currentJob.createdAt }
    }
  });

  // Calculate position: (Number of people waiting ahead of you) + 1
  const queuePosition = aheadInQueue + 1;
  
  // Calculate Estimated Wait Time (EWT)
  // Assuming 5 concurrent workers max, and ~25 seconds per job batch
  const MAX_CONCURRENT_JOBS = 5;
  const AVG_JOB_SECONDS = 25;
  
  const estimatedBatches = Math.ceil(queuePosition / MAX_CONCURRENT_JOBS);
  const estimatedSeconds = estimatedBatches * AVG_JOB_SECONDS;

  return {
    position: queuePosition,
    estimatedSeconds: estimatedSeconds,
    activeWorkers: activeCount
  };
}

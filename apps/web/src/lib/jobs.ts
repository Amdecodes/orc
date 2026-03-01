import prisma from "./prisma";
import { generateID } from "@et-id-ocr/id-engine";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "./upload";

export async function processJob(jobId: string, userId: string, frontPath: string, backPath: string, photoPath: string) {
  let status: "SUCCESS" | "FAILED" = "FAILED";
  let user: any = null;

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
    
    const outputFileName = `id-${jobId}.${format}`;
    const outputPath = path.join(userDir, outputFileName);
    await writeFile(outputPath, image);

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

    // 4. Instantly clean up input sources to save disk space
    const exists = (p: string) => fs.existsSync(p);
    await Promise.allSettled([
      frontPath && exists(frontPath) ? unlink(frontPath) : Promise.resolve(),
      backPath && exists(backPath) ? unlink(backPath) : Promise.resolve(),
      photoPath && exists(photoPath) ? unlink(photoPath) : Promise.resolve()
    ]);

  } catch (error: any) {
    console.error(`Processing failed for job ${jobId}:`, error);
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "FAILED" },
    });
    status = "FAILED";
  } finally {
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
                    status: status
                })
            });
            console.log(`[Worker] Bot notification response: ${response.status} ${response.statusText}`);
        } catch (notifyErr) {
            console.error("Failed to notify bot for job", jobId, notifyErr);
        }
    }
  }
}

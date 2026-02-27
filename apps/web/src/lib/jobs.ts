import prisma from "./prisma";
import { generateID } from "@et-id-ocr/id-engine";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "./upload";

export async function processJob(jobId: string, userId: string, frontPath: string, backPath: string, photoPath: string) {
  try {
    // 1. Read files
    const frontBuffer = await readFile(frontPath);
    const backBuffer = await readFile(backPath);
    const thirdBuffer = await readFile(photoPath);

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
          outputPath: outputPath 
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

    // 4. Instantly clean up input sources to save disk space
    await Promise.allSettled([
      unlink(frontPath).catch(err => console.error("Failed to delete front source", err)),
      unlink(backPath).catch(err => console.error("Failed to delete back source", err)),
      unlink(photoPath).catch(err => console.error("Failed to delete photo source", err))
    ]);

  } catch (error) {
    console.error(`Processing failed for job ${jobId}:`, error);
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "FAILED" },
    });
  }
}

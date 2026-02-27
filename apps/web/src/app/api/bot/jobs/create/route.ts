import { validateBotSecret } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { NextResponse } from "next/server";
import { processJob } from "@/lib/jobs";

export async function POST(req: Request) {
  if (!validateBotSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const botUserId = formData.get("userId") as string;
    const front = formData.get("front") as File;
    const back = formData.get("back") as File;
    const photo = formData.get("photo") as File;

    if (!botUserId || !front || !back || !photo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Support both internal UUID and Telegram ID
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { id: botUserId },
                { telegramId: botUserId }
            ]
        }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.credits < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const userId = user.id;

    // 1. Save files
    const frontPath = await saveUploadedFile(front, userId, "jobs");
    const backPath = await saveUploadedFile(back, userId, "jobs");
    const photoPath = await saveUploadedFile(photo, userId, "jobs");

    // 2. Create Job in PENDING state
    const job = await prisma.job.create({
      data: {
        userId,
        status: "PROCESSING",
        cost: 1,
        frontImagePath: frontPath,
        backImagePath: backPath,
        photoPath: photoPath,
      },
    });

    // 3. Trigger processing (async)
    processJob(job.id, userId, frontPath, backPath, photoPath).catch(console.error);

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error("Bot Job Create Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

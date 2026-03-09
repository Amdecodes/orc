import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/upload";
import { processJob } from "@/lib/jobs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const formData = await req.formData();
  const front = formData.get("front") as File;
  const back = formData.get("back") as File;
  const third = formData.get("third") as File;

  if (!front || !back || !third) {
    return NextResponse.json({ error: "Missing files" }, { status: 400 });
  }

  try {
    // 1. Atomically reserve 1 credit — prevents race conditions with concurrent submissions
    const reserved = await prisma.user.updateMany({
      where: { id: userId, credits: { gte: 1 } },
      data: { credits: { decrement: 1 } },
    });
    if (reserved.count === 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // 2. Save Files Locally
    const frontPath = await saveUploadedFile(front, userId, "front");
    const backPath = await saveUploadedFile(back, userId, "back");
    const photoPath = await saveUploadedFile(third, userId, "photo");

    // 3. Create Job (status: PENDING)
    const job = await prisma.job.create({
      data: {
        userId,
        status: "PENDING",
        cost: 1,
        frontImagePath: frontPath,
        backImagePath: backPath,
        photoPath: photoPath,
        source: "WEB",
      },
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    console.error("Job Creation Error:", error);
    
    // Bubble up user-facing validation errors from upload.ts
    if (error.message?.includes("File too large") || error.message?.includes("Invalid file type")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 });
  }
}

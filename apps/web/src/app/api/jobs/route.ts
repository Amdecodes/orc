import { auth } from "@/lib/auth";
import { generateID } from "@et-id-ocr/id-engine";
import { deductCredits } from "@et-id-ocr/credit-engine";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    // 1. Check & Deduct Credits
    await deductCredits(userId, 1);

    // 2. Convert Files to Buffers
    const frontBuffer = Buffer.from(await front.arrayBuffer());
    const backBuffer = Buffer.from(await back.arrayBuffer());
    const thirdBuffer = Buffer.from(await third.arrayBuffer());

    // 3. Generate ID
    const { image, format } = await generateID(frontBuffer, backBuffer, thirdBuffer);

    // 4. Save Job
    const job = await prisma.job.create({
      data: {
        userId,
        status: "SUCCESS",
        cost: 1,
        // In a real app, you'd upload this to S3/Blob storage
        output: `data:image/${format};base64,${image.toString("base64")}`,
      },
    });

    return NextResponse.json({ success: true, jobId: job.id, imageUrl: job.output });
  } catch (error: any) {
    console.error("ID Generation Error:", error);
    if (error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

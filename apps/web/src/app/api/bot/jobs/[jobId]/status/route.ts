import { validateBotSecret } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  if (!validateBotSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        outputPath: true,
      },
    });

    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Bot Job Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

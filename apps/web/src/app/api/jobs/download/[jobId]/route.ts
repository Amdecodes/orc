import { auth, validateBotSecret } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  let userId: string | undefined;

  // 1. Try Session Auth
  const session = await auth.api.getSession({ headers: req.headers });
  if (session) {
    userId = session.user.id;
  }

  // 2. Try Bot Secret Auth
  const isBot = validateBotSecret(req);

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) return new Response("Not found", { status: 404 });

    // Security: Only owner can download (unless it's the bot)
    if (!isBot && job.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!job.outputPath) {
      return new Response("File not generated yet", { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const isInline = searchParams.get("inline") === "true";

    const file = await readFile(job.outputPath);
    return new Response(file, {
      headers: { 
        "Content-Type": "image/png",
        "Content-Disposition": isInline 
          ? "inline" 
          : `attachment; filename="formatted-id-${jobId}.png"`,
      },
    });
  } catch (error) {
    console.error("Job Download Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await prisma.job.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50, // last 50 jobs
      select: {
        id: true,
        status: true,
        outputPath: true,
        createdAt: true,
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Fetch Job History Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

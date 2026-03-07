import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, errorMessage: true, createdAt: true, updatedAt: true }
    });
    
    const results = jobs.map(r => ({
      id: r.id,
      status: r.status,
      error: r.errorMessage,
      durationSeconds: (r.updatedAt.getTime() - r.createdAt.getTime()) / 1000
    }));

    return NextResponse.json({ jobs: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

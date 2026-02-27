import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await prisma.topUpRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { email: true, credits: true, username: true, name: true, telegramId: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Admin Fetch Pending Requests Error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

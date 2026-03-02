import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [topups, payments] = await Promise.all([
      prisma.topUpRequest.findMany({
        where: { status: "PENDING" },
        include: {
          user: { select: { email: true, credits: true, username: true, name: true, telegramId: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.findMany({
        where: { status: "PENDING" },
        include: {
          user: { select: { email: true, credits: true, username: true, name: true, telegramId: true } },
          package: true
        },
        orderBy: { createdAt: "asc" },
      })
    ]);

    // Unified queue with type discriminator
    const unifiedQueue = [
      ...topups.map(t => ({ ...t, type: "TOPUP" })),
      ...payments.map(p => ({ ...p, type: "PAYMENT" }))
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json(unifiedQueue);
  } catch (error) {
    console.error("Admin Fetch Pending Requests Error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

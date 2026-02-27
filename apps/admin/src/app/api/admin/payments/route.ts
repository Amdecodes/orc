import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Handles fetching all payments for the admin dashboard
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: { select: { email: true } },
        package: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Admin Fetch Payments Error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// Handles payment actions (APPROVE/REJECT)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { paymentId, action } = await req.json();

    if (action === "APPROVE") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "APPROVED", adminId: userId, approvedAt: new Date() },
      });
    } else if (action === "REJECT") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "REJECTED", adminId: userId, approvedAt: new Date() },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Action Error:", error);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}

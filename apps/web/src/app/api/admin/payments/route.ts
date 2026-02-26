import { auth } from "@/lib/auth";
import { approvePayment, rejectPayment } from "@et-id-ocr/payment-engine";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentId, action } = await req.json();

  try {
    if (action === "APPROVE") {
      await approvePayment(paymentId, session.user.id);
    } else if (action === "REJECT") {
      await rejectPayment(paymentId, session.user.id);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Action Error:", error);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const { userId: adminId } = await auth();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestId, action } = await req.json();

    const topup = await prisma.topUpRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!topup || topup.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request not found or already handled" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.topUpRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        }),
        prisma.user.update({
          where: { id: topup.userId },
          data: { credits: { increment: topup.credits } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId: topup.userId,
            amount: topup.credits,
            reason: "TOPUP",
            reference: requestId,
          },
        }),
      ]);
    } else {
      await prisma.topUpRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
    }

    // --- Notify the Bot ---
    if (topup.user.telegramId) {
      try {
        const message = action === "APPROVE" 
          ? `Your top-up of ${topup.credits} credits was approved!` 
          : `Your top-up request for ${topup.credits} credits was rejected. Please contact support.`;

        await axios.post("http://localhost:5005/notify", {
          telegramId: topup.user.telegramId,
          message,
          status: action,
        }, {
          headers: {
            "x-bot-secret": process.env.BOT_SECRET || "SUPER_SECRET_BOT_TOKEN_2026",
          }
        });
      } catch (notifyError) {
        console.error("Failed to notify bot:", notifyError);
        // We don't fail the whole request just because notification failed
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Handle TopUp Action Error:", error);
    return NextResponse.json({ error: "Failed to handle request" }, { status: 500 });
  }
}

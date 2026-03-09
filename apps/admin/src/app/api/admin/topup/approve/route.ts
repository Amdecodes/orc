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
    const { requestId, action, type = "TOPUP" } = await req.json();

    let targetItem;
    if (type === "TOPUP") {
      targetItem = await prisma.topUpRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });
    } else {
      targetItem = await prisma.payment.findUnique({
        where: { id: requestId },
        include: { user: true },
      });
    }

    if (!targetItem || targetItem.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request not found or already handled" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      await prisma.$transaction([
        type === "TOPUP" 
          ? prisma.topUpRequest.update({
              where: { id: requestId },
              data: { status: "APPROVED" },
            })
          : prisma.payment.update({
              where: { id: requestId },
              data: { status: "APPROVED", adminId, approvedAt: new Date() },
            }),
        prisma.user.update({
          where: { id: targetItem.userId },
          data: { credits: { increment: targetItem.credits } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId: targetItem.userId,
            amount: targetItem.credits,
            reason: type === "TOPUP" ? "TOPUP" : "PAYMENT",
            reference: requestId,
          },
        }),
        prisma.notification.create({
          data: {
            userId: targetItem.userId,
            title: "Top-up Approved ✅",
            message: `Your top-up of ${targetItem.credits} credits has been approved and added to your account.`,
            type: "SUCCESS",
          },
        }),
      ]);
    } else {
      if (type === "TOPUP") {
        await prisma.$transaction([
          prisma.topUpRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" },
          }),
          prisma.notification.create({
            data: {
              userId: targetItem.userId,
              title: "Top-up Request Declined ❌",
              message: `Your top-up request for ${targetItem.credits} credits was declined. Please contact support if you need help.`,
              type: "ERROR",
            }
          }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: requestId },
            data: { status: "REJECTED", adminId, approvedAt: new Date() },
          }),
          prisma.notification.create({
            data: {
              userId: targetItem.userId,
              title: "Payment Declined ❌",
              message: `Your payment for ${targetItem.credits} credits was declined. Please contact support if you need help.`,
              type: "ERROR",
            }
          }),
        ]);
      }
    }

    // --- Notify the Bot ---
    if (targetItem.user.telegramId) {
      try {
        const itemType = type === "TOPUP" ? "Top-up" : "Payment";
        const message = action === "APPROVE" 
          ? `✅ Your ${itemType} of ${targetItem.credits} credits was approved!` 
          : `❌ Your ${itemType} request for ${targetItem.credits} credits was rejected. Please contact support.`;

        const botUrl = process.env.BOT_INTERNAL_URL || "http://bot:5005";
        await axios.post(`${botUrl}/notify`, {
          telegramId: targetItem.user.telegramId,
          message,
          status: action,
        }, {
          headers: {
            "x-bot-secret": process.env.BOT_SECRET || "",
          }
        });
      } catch (notifyError) {
        console.error("Failed to notify bot:", notifyError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Handle Action Error:", error);
    return NextResponse.json({ error: "Failed to handle request" }, { status: 500 });
  }
}

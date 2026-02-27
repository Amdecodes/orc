import { validateBotSecret } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!validateBotSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { telegramId, username, firstName } = await req.json();

    if (!telegramId) return NextResponse.json({ error: "Missing telegramId" }, { status: 400 });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: String(telegramId),
          name: firstName || username || "Telegram User",
          email: `tg_${telegramId}@telegram.bot`, // Dummy email for better-auth compatibility
          credits: 1, // 1 free credit for new bot users
          role: "USER",
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Bot User Get/Create Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

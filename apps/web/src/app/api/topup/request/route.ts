import { auth, validateBotSecret } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  console.log("--- TOPUP REQUEST START ---");
  try {
    const formData = await req.formData();
    const packageId = formData.get("packageId") as string;
    const screenshot = formData.get("screenshot") as File | null;
    const referenceText = formData.get("referenceText") as string | null;
    const botUserId = formData.get("userId") as string | null;

    console.log("Parsed FormData:", { packageId, hasScreenshot: !!screenshot, referenceText, botUserId });

    let userId: string;

    // 1. Authenticate (Session or Bot Secret)
    const session = await auth.api.getSession({ headers: req.headers });
    if (session) {
      userId = session.user.id;
      console.log("Authenticated via Session:", userId);
    } else if (validateBotSecret(req) && botUserId) {
      console.log("Validating Bot Secret for ID:", botUserId);
      // Find internal user by either ID (UUID) or Telegram ID
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: botUserId },
            { telegramId: botUserId }
          ]
        },
      });
      if (!user) {
        console.error("Bot user not found in DB for ID:", botUserId);
        return NextResponse.json({ error: "Bot user not found in DB" }, { status: 404 });
      }
      userId = user.id;
      console.log("Authenticated via Bot Secret. Found User:", userId);
    } else {
      console.error("Unauthorized Top-up Request Attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!packageId) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    if (!screenshot && !referenceText) {
      return NextResponse.json({ error: "Either screenshot or reference text is required" }, { status: 400 });
    }

    let screenshotPath: string | null = null;
    if (screenshot) {
      const bytes = await screenshot.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Use absolute path relative to project root to ensure shared access during dev
      const rootDir = process.env.PROJECT_ROOT || process.cwd().split('/apps/')[0];
      const uploadDir = path.join(rootDir, "tmp", "uploads", "topups");
      await mkdir(uploadDir, { recursive: true });
      
      const fileName = `${userId}-${Date.now()}-${screenshot.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const absolutePath = path.join(uploadDir, fileName);
      
      console.log("Saving screenshot to:", absolutePath);
      await writeFile(absolutePath, buffer);
      screenshotPath = absolutePath; // Store ABSOLUTE path in DB for admin to read easily
    }

    // 2. Create Top-up Request
    console.log("Creating TopUpRequest in Prisma...");
    const request = await prisma.topUpRequest.create({
      data: {
        userId,
        credits: packageId === "1" ? 1 : packageId === "10" ? 10 : 40,
        price: packageId === "1" ? 50 : packageId === "10" ? 450 : 1400,
        screenshotPath,
        referenceText,
        status: "PENDING",
      },
    });

    console.log("TopUpRequest Created:", request.id);
    return NextResponse.json({ success: true, requestId: request.id });
  } catch (error: any) {
    console.error("CRITICAL TOP-UP ERROR:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error?.message 
    }, { status: 500 });
  }
}

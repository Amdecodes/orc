import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const packageId = formData.get("packageId") as string;
    const credits = parseInt(formData.get("credits") as string);
    const amount = parseInt(formData.get("amount") as string);
    const referenceText = formData.get("referenceText") as string | null;
    const proof = formData.get("proof") as File | null;

    if (!packageId || isNaN(credits) || isNaN(amount)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let screenshotPath: string | null = null;
    if (proof) {
      const bytes = await proof.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), "..", "..", "tmp", "uploads", "topups");
      await mkdir(uploadDir, { recursive: true });
      
      const fileName = `${session.user.id}-${Date.now()}-${proof.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const absolutePath = path.join(uploadDir, fileName);
      
      await writeFile(absolutePath, buffer);
      screenshotPath = absolutePath;
    }

    // Create TopUpRequest instead of Payment to show up in Admin Vault
    const request = await prisma.topUpRequest.create({
      data: {
        userId: session.user.id,
        credits: credits,
        price: amount,
        screenshotPath,
        referenceText,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, requestId: request.id });
  } catch (error: any) {
    console.error("Payment Submission Error:", error);
    return NextResponse.json({ error: "Failed to submit payment", details: error?.message }, { status: 500 });
  }
}

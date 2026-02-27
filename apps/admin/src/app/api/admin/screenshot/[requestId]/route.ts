import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const topup = await prisma.topUpRequest.findUnique({
      where: { id: requestId },
    });

    if (!topup || !topup.screenshotPath) {
      return new Response("Screenshot not found", { status: 404 });
    }
    
    const file = await readFile(topup.screenshotPath);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/*",
      },
    });
  } catch (error) {
    console.error("Admin Screenshot View Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Performance: Still return success to prevent email enumeration
      return NextResponse.json({ success: true, message: "If an account exists, an OTP has been sent." });
    }

    // Create OTP
    const otp = await createOTP(email, "RESET_PASSWORD");

    // Send Email
    await sendOTPEmail(email, otp.code);

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error requesting forgot-password OTP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

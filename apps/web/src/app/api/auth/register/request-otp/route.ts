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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // For security, don't reveal if user exists, but here we explicitly can for registration
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Create OTP
    const otp = await createOTP(email, "REGISTER");

    // Send Email
    await sendOTPEmail(email, otp.code);

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error requesting registration OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

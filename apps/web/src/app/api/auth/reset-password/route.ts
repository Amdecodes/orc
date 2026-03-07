import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { hashPassword } from "better-auth/crypto";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Verify OTP
    const validOtp = await verifyOTP(email, code, "RESET_PASSWORD");

    if (!validOtp) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash the new password using better-auth's hashing (scrypt)
    const hashed = await hashPassword(newPassword);

    // Update the credential account's password
    const updated = await prisma.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password: hashed },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "No credential account found for this user" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password, code } = await req.json();

    if (!email || !password || !code || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Verify OTP
    const validOtp = await verifyOTP(email, code, "REGISTER");

    if (!validOtp) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // Create User via Better Auth
    try {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      });

      // Update emailVerified status since they just verified with OTP
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true },
      });

      return NextResponse.json({ success: true, message: "Registration successful" });
    } catch (authError: any) {
      console.error("Better Auth SignUp Error:", authError);
      return NextResponse.json({ error: authError.message || "Registration failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error verifying registration OTP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

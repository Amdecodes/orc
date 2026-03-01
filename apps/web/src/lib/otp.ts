import prisma from "@/lib/prisma";
import { OTPPurpose } from "../../../../prisma/generated-client";

/**
 * Generates a random 6-digit OTP code as a string.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates and saves a new OTP for the given email and purpose.
 * Default expiration is 10 minutes.
 */
export async function createOTP(email: string, purpose: OTPPurpose) {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  const otp = await prisma.oTP.create({
    data: {
      email,
      code,
      purpose,
      expiresAt,
    },
  });

  return otp;
}

/**
 * Verifies an OTP for the given email and purpose.
 * Checks if the code exists, matches, is not used, and is not expired.
 * Marks the code as used upon successful verification.
 */
export async function verifyOTP(email: string, code: string, purpose: OTPPurpose) {
  const otp = await prisma.oTP.findFirst({
    where: {
      email,
      code,
      purpose,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!otp) {
    return null;
  }

  // Mark as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return otp;
}

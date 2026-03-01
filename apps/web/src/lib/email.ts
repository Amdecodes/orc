/**
 * Mock email utility for sending OTP codes.
 * In a real-world scenario, you would integrate with a service like Resend or SendGrid.
 */
export async function sendOTPEmail(email: string, code: string) {
  console.log(`[EMAIL MOCK] Sending OTP to ${email}: ${code}`);
  
  // Example integration structure (commented out):
  /*
  await resend.emails.send({
    from: 'onboarding@yourdomain.com',
    to: email,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Verification Code</h2>
        <p>Your 6-digit verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #7c3aed; padding: 10px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
  */

  return { success: true };
}

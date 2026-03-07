import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
    if (!_resend) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            return null;
        }
        _resend = new Resend(apiKey);
    }
    return _resend;
}

export async function sendEmail({
    to,
    subject,
    text,
    html,
    idempotencyKey,
}: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    idempotencyKey?: string;
}) {
    const resend = getResend();
    if (!resend) {
        console.error("Resend API key is missing. Email will not be sent.");
        return { data: null, error: { name: "missing_api_key", message: "RESEND_API_KEY is not defined" } };
    }

    const { data, error } = await (resend.emails.send({
        from: "noreply@nationalidformatter.app",
        to,
        subject,
        text,
        html: html || text,
        idempotencyKey,
    } as any));

    if (error) {
        console.error("Resend Error:", error.name, error.message);
    }

    return { data, error };
}

export async function sendOTPEmail(to: string, code: string) {
    return sendEmail({
        to,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${code}. It expires in 10 minutes.`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #333;">Security Code</h2>
                <p>Use the following code to complete your request. This code will expire in 10 minutes.</p>
                <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 4px;">
                    ${code}
                </div>
                <p style="color: #777; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
            </div>
        `,
    });
}

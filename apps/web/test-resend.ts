import { sendEmail } from "./src/lib/email";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

async function testResend() {
    const testEmail = process.argv[2];
    if (!testEmail) {
        console.error("Please provide a test email address: npm run test-resend <email>");
        process.exit(1);
    }

    console.log(`Sending test email to ${testEmail}...`);
    try {
        await sendEmail({
            to: testEmail,
            subject: "Resend Test Connection",
            text: "This is a test email to verify your Resend connection.",
            html: "<strong>This is a test email to verify your Resend connection.</strong>",
        });
        console.log("Test email sent successfully!");
    } catch (error) {
        console.error("Failed to send test email:", error);
    }
}

testResend();

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { sendEmail } from "./email";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    secret: (() => {
        const secret = process.env.BETTER_AUTH_SECRET;
        if (!secret && process.env.NODE_ENV === "production") {
            throw new Error("BETTER_AUTH_SECRET must be set in production");
        }
        return secret || "build-time-only-not-for-production";
    })(),
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trustedOrigins: [
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://nationalidformatter.app",
        "https://admin.nationalidformatter.app"
    ],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 4,
        maxPasswordLength: 128,
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }) => {
            const { error } = await sendEmail({
                to: user.email,
                subject: "Verify your email",
                text: `Click the link to verify your email: ${url}`,
                html: `<p>Click the link to verify your email: <a href="${url}">${url}</a></p><p>Or use this code: <b>${token}</b></p>`,
                idempotencyKey: `verification-email/${user.id}-${token.substring(0, 8)}`,
            });
            if (error) {
                throw new Error(`Failed to send verification email: ${error.message}`);
            }
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "build-time-dummy-google-id",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "build-time-dummy-google-secret",
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "USER",
            },
            credits: {
                type: "number",
                defaultValue: 1,
            },
            telegramId: {
                type: "string",
                required: false,
            }
        }
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    advanced: {
        cookies: {
            sessionToken: {
                attributes: {
                    sameSite: "lax",
                    // For localhost subdomains to work, we often need to NOT set a domain, 
                    // or use a host-only cookie which is the default.
                }
            }
        }
    }
});

export function validateBotSecret(req: Request) {
    const secret = req.headers.get("x-bot-secret");
    return secret === process.env.BOT_SECRET;
}

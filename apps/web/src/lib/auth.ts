import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    secret: process.env.BETTER_AUTH_SECRET || "build-time-dummy-secret-for-nextjs-build",
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    emailAndPassword: {
        enabled: true,
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
                defaultValue: 0,
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

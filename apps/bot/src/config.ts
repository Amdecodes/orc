import "dotenv/config";

export const config = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN!,
  API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000',
  BOT_SECRET: process.env.BOT_SECRET!
};

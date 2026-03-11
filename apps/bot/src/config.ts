import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN!,
  API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000',
  BOT_SECRET: process.env.BOT_SECRET!
};

import { PrismaClient } from "../../../../prisma/generated-client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

if (typeof process !== "undefined" && process.env && !process.env.DATABASE_URL) {
  try {
    const fs = require("fs");
    const path = require("path");
    const dotenv = require("dotenv");

    const pathsToTry = [
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "../../.env"),
    ];

    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p });
        if (process.env.DATABASE_URL) break;
      }
    }
  } catch (e) {
    // Fail silently in non-Node environments
  }
}

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("⚠️ DATABASE_URL is not set. Prisma might fail.");
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();
export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

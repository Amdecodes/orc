import { PrismaClient } from "../../../../prisma/generated-client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";

// In monorepos with background workers, guarantee variables are loaded BEFORE Prisma initializes.
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
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

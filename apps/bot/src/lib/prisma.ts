import { PrismaClient } from "../../../../prisma/generated-client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
// Symlinks natively bring root .env here

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dummy?schema=public";

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

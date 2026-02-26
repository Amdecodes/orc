import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dummy?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function addCredits(userId, amount) {
  return await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
  });
}

export async function deductCredits(userId, amount) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.credits < amount) {
    throw new Error('INSUFFICIENT_CREDITS');
  }
  return await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: amount } },
  });
}

export async function getBalance(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.credits || 0;
}

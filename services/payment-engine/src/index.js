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

export async function createPayment(userId, { packageId, amount, credits, method, referenceText, proofUrl }) {
  return await prisma.payment.create({
    data: {
      userId,
      packageId,
      amount,
      credits,
      method,
      referenceText,
      proofUrl,
      status: 'PENDING',
    },
  });
}

export async function approvePayment(paymentId, adminId) {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        adminId,
        approvedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        credits: { increment: payment.credits },
      },
    });

    await tx.transaction.create({
      data: {
        userId: payment.userId,
        type: 'TOPUP',
        amount: payment.credits,
      },
    });

    return payment;
  });
}

export async function rejectPayment(paymentId, adminId) {
  return await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'REJECTED',
      adminId,
    },
  });
}

export async function getPendingPayments() {
  return await prisma.payment.findMany({
    where: { status: 'PENDING' },
    include: {
      user: true,
      package: true,
    },
  });
}

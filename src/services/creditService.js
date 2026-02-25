import prisma from '../db.js';

export const COST_PER_ID = 1;

/**
 * Deduct credits from a user for an ID job.
 * @param {string} userId UUID of the user
 * @param {string} jobId UUID of the ID job
 * @returns {Promise<void>}
 */
export async function deductCredits(userId, jobId) {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user || user.credits < COST_PER_ID) {
      throw new Error('INSUFFICIENT_CREDITS');
    }

    // Deduct credits
    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: COST_PER_ID } }
    });

    // Log transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -COST_PER_ID,
        reason: 'ID_GENERATION',
        refId: jobId
      }
    });

    // Update job status
    await tx.iDJob.update({
      where: { id: jobId },
      data: { status: 'success' }
    });
  });
}

/**
 * Refund credits to a user (e.g., on job failure if deducted upfront, 
 * though the plan suggests deducting after success).
 * @param {string} userId UUID of the user
 * @param {string} jobId UUID of the ID job
 * @param {string} reason Reason for refund
 * @returns {Promise<void>}
 */
export async function refundCredits(userId, jobId, reason = 'REFUND_OCR_FAILURE') {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: COST_PER_ID } }
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        amount: COST_PER_ID,
        reason,
        refId: jobId
      }
    });
  });
}

/**
 * Manually top up user credits (Admin action).
 * @param {string} userId UUID of the user
 * @param {number} amount Number of credits to add
 * @param {string} adminId UUID of the admin
 * @param {string} reason Reason for top-up
 * @returns {Promise<void>}
 */
export async function adminTopUp(userId, amount, adminId, reason = 'ADMIN_TOPUP') {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } }
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        reason,
        refId: adminId
      }
    });
  });
}

/**
 * Check if a user has enough credits.
 * @param {string} userId UUID of the user
 * @returns {Promise<boolean>}
 */
export async function hasEnoughCredits(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true }
  });
  return user ? user.credits >= COST_PER_ID : false;
}

/**
 * Get or create a user by Telegram ID.
 * @param {number} telegramId
 * @returns {Promise<object>}
 */
export async function getOrCreateUserByTelegramId(telegramId) {
  let user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: BigInt(telegramId)
      }
    });
  }

  return user;
}

/**
 * Get user statistics (total successful jobs).
 * @param {string} userId UUID of the user
 * @returns {Promise<number>}
 */
export async function getUserTotalJobs(userId) {
  return await prisma.iDJob.count({
    where: { 
      userId,
      status: 'success'
    }
  });
}

/**
 * Get recent job history for a user.
 * @param {string} userId UUID of the user
 * @param {number} limit Number of jobs to return
 * @returns {Promise<Array>}
 */
export async function getUserJobHistory(userId, limit = 5) {
  return await prisma.iDJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      status: true,
      createdAt: true
    }
  });
}

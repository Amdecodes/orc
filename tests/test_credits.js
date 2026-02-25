import prisma from '../src/db.js';
import { getOrCreateUserByTelegramId, hasEnoughCredits, deductCredits, adminTopUp, COST_PER_ID } from '../src/services/creditService.js';

async function runTest() {
  console.log('🧪 Starting Credit System Tests...');
  const testTelegramId = 999999999;

  try {
    // 1. Get or create user
    console.log('1. Fetching/Creating Test User...');
    const user = await getOrCreateUserByTelegramId(testTelegramId);
    console.log(`User created: ${user.id} with ${user.credits} credits.`);

    // 2. Check initial credits
    console.log('2. Verifying initial credit balance...');
    if (user.credits !== 0) {
      console.warn('⚠️ Warning: Initial credits not 0. Was this user already present?');
    }

    // 3. Admin Top-up
    console.log('3. Performing admin top-up...');
    await adminTopUp(user.id, 5, 'admin-uuid-123', 'TEST_TOPUP');
    const userAfterTopup = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`New balance: ${userAfterTopup.credits} credits.`);

    if (userAfterTopup.credits !== user.credits + 5) {
      throw new Error('Credit top-up mismatch');
    }

    // 4. Create a dummy job
    console.log('4. Creating test ID job...');
    const job = await prisma.iDJob.create({
      data: {
        userId: user.id,
        status: 'pending'
      }
    });

    // 5. Deduct credits
    console.log('5. Deducting credits for job...');
    await deductCredits(user.id, job.id);
    const userAfterDeduction = await prisma.user.findUnique({ where: { id: user.id } });
    const jobAfterDeduction = await prisma.iDJob.findUnique({ where: { id: job.id } });

    console.log(`New balance: ${userAfterDeduction.credits} credits. Job status: ${jobAfterDeduction.status}`);

    if (userAfterDeduction.credits !== userAfterTopup.credits - COST_PER_ID) {
      throw new Error('Credit deduction failure');
    }

    // 6. Insufficient credits test
    console.log('6. Testing insufficient credits...');
    // Add 100 more credits then deduct 105
    await prisma.user.update({ where: { id: user.id }, data: { credits: 0 } });
    try {
      await deductCredits(user.id, job.id);
      throw new Error('Deduction should have failed due to zero credits');
    } catch (err) {
      if (err.message === 'INSUFFICIENT_CREDITS') {
        console.log('✅ Correctly caught INSUFFICIENT_CREDITS error.');
      } else {
        throw err;
      }
    }

    console.log('\n✨ All credit system tests PASSED!');

  } catch (err) {
    console.error('\n❌ Test FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();

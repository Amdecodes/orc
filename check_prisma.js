import { prisma } from './src/db/prisma.js';

async function check() {
  try {
    console.log('Testing UserState update...');
    // We don't need to actually run it on a real user if we just want to test validation,
    // but the error happens at validation time.
    // Let's find a user first or just try to update a non-existent one to trigger validation.
    await prisma.user.update({
      where: { id: 'non-existent-id' },
      data: { state: 'WAIT_PAYMENT_PROOF' }
    });
  } catch (err) {
    console.log('--- ERROR START ---');
    console.log(err.message);
    console.log('--- ERROR END ---');
  } finally {
    await prisma.$disconnect();
  }
}

check();

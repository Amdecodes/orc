import prisma from '../src/db.js';

const telegramId = process.argv[2];

if (!telegramId) {
  console.error('❌ Please provide a Telegram ID. Usage: node scripts/promote_admin.js <telegram_id>');
  process.exit(1);
}

async function promote() {
  try {
    const user = await prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { role: 'admin' }
    });
    console.log(`✅ User ${telegramId} (${user.id}) promoted to ADMIN.`);
  } catch (err) {
    console.error('❌ Failed to promote user. Ensure they have used the bot at least once.');
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

promote();

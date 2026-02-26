import TelegramBot from 'node-telegram-bot-api';
import { config } from './config.js';
import prisma from './lib/prisma.js';
import { generateID } from '@et-id-ocr/id-engine';
import { addCredits, deductCredits, getBalance } from '@et-id-ocr/credit-engine';
import { createPayment } from '@et-id-ocr/payment-engine';

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// --- Database Helpers ---

async function getOrCreateUser(msg: TelegramBot.Message | TelegramBot.CallbackQuery) {
  const from = msg.from;
  if (!from) throw new Error('No user data in message');

  const { id: telegramId, username, first_name, last_name } = from;
  const fullName = [first_name, last_name].filter(Boolean).join(' ');
  
  let user = await prisma.user.findFirst({
    where: { telegramId: telegramId.toString() }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: telegramId.toString(),
        name: fullName || username || `user_${telegramId}`,
        email: `${telegramId}@telegram.bot`,
        credits: 0,
        role: 'USER',
        state: 'IDLE'
      } as any
    });
  }

  return { user };
}

// --- Keyboards ---

const mainMenuMarkup: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: '🪪 Generate ID', callback_data: 'GEN_ID' }],
    [{ text: '💳 Buy Credits', callback_data: 'TOP_UP' }, { text: '📂 History', callback_data: 'HISTORY' }],
    [{ text: '📞 Support', callback_data: 'HELP' }]
  ]
};

const topupMenuMarkup = (packages: any[]): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    ...packages.map(pkg => ([{ text: `🔹 ${pkg.name} (${pkg.credits} IDs) - ${pkg.priceETB} ETB`, callback_data: `PKG_${pkg.id}` }])),
    [{ text: '⬅️ Back', callback_data: 'START' }]
  ]
});

const cancelMenuMarkup: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: '❌ Cancel & Reset', callback_data: 'START' }]]
};

// --- Handlers ---

bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
  try {
    const { user } = await getOrCreateUser(msg);
    const text = `🔹 *National ID Formatter*\n\n` +
                 `Professional, print-ready Ethiopian IDs in seconds.\n\n` +
                 `🚀 *How it works:*\n` +
                 `1. Upload 3 screenshots (Front, Back, Profile)\n` +
                 `2. We auto-format everything\n` +
                 `3. Download high-quality print file\n\n` +
                 `💳 *Balance:* \`${user.credits} credits\``;
    
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown', reply_markup: mainMenuMarkup });
  } catch (err) {
    console.error('[Bot] Start error:', err);
    bot.sendMessage(msg.chat.id, '❌ Failed to connect to server.');
  }
});

bot.onText(/\/cancel/, async (msg: TelegramBot.Message) => {
  try {
    const { user } = await getOrCreateUser(msg);
    await prisma.user.update({
      where: { id: user.id },
      data: { state: 'IDLE' }
    });
    bot.sendMessage(msg.chat.id, '🔄 *Action cancelled.*', { parse_mode: 'Markdown', reply_markup: mainMenuMarkup });
  } catch (e) {
    bot.sendMessage(msg.chat.id, '❌ Failed to reset state.');
  }
});

bot.onText(/\/balance/, async (msg: TelegramBot.Message) => {
  try {
    const { user } = await getOrCreateUser(msg);
    bot.sendMessage(msg.chat.id, `💳 *Current Balance:* \`${user.credits} credits\``, { parse_mode: 'Markdown' });
  } catch (e) {
    bot.sendMessage(msg.chat.id, '❌ Failed to fetch balance.');
  }
});

bot.on('callback_query', async (callbackQuery: TelegramBot.CallbackQuery) => {
  const { data, message } = callbackQuery;
  if (!message || !data) return;

  const chatId = message.chat.id;
  
  try {
    const { user } = await getOrCreateUser(callbackQuery);

    if (data === 'START') {
      const text = `🔹 *National ID Formatter*\n\n` +
                   `💳 *Balance:* \`${user.credits} credits\``;
      bot.editMessageText(text, { 
        chat_id: chatId, 
        message_id: message.message_id, 
        parse_mode: 'Markdown', 
        reply_markup: mainMenuMarkup 
      });
    }

    if (data === 'GEN_ID') {
      if (user.credits < 1) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Not enough credits. Please top up.', show_alert: true });
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'WAIT_FRONT' }
      });

      bot.sendMessage(chatId, '📷 *Step 1/3*\nPlease send the **FRONT** screenshot of the ID', { 
        parse_mode: 'Markdown',
        reply_markup: cancelMenuMarkup
      });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data === 'TOP_UP') {
      const packages = await prisma.creditPackage.findMany({ where: { active: true } });
      bot.editMessageText('💳 *Select a Credit Plan*', {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        reply_markup: topupMenuMarkup(packages)
      });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data.startsWith('PKG_')) {
      const pkgId = data.split('_')[1];
      if (!pkgId) return bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Invalid package.' });

      const pkg = await prisma.creditPackage.findUnique({ 
        where: { id: pkgId } 
      });
      if (!pkg) return bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Package not found.' });

      const text = `🧾 *Order Details*\n\n` +
                   `Package: *${pkg.name}*\n` +
                   `Amount: *${pkg.priceETB} ETB*\n\n` +
                   `📍 *Payment Instructions*\n` +
                   `Send payment to:\n` +
                   `🏦 *Bank:* Telebirr / CBE\n` +
                   `🔢 *Account:* 1000xxxxxx\n` +
                   `👤 *Name:* National ID Services\n\n` +
                   `📸 *Final Step:*\n` +
                   `Upload the receipt screenshot here. We will approve it instantly.`;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          state: 'WAIT_PAYMENT_PROOF',
          pendingPackageId: pkgId
        }
      });

      bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: cancelMenuMarkup });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data === 'HISTORY') {
      const jobs = await prisma.job.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      let text = `📂 *Your Recent Jobs*\n\n`;
      if (jobs.length === 0) text += 'No history found.';
      else {
        jobs.forEach((job: any, i: number) => {
          text += `${i+1}. ${job.status === 'SUCCESS' ? '✅' : '❌'} Job #${job.id.slice(-4)} — ${new Date(job.createdAt).toLocaleDateString()}\n`;
        });
      }

      bot.editMessageText(text, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'START' }]] }
      });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data === 'HELP') {
       const text = `🛠️ *National ID Formatter Support*\n\n` +
                    `• Each generation costs **1 credit**.\n` +
                    `• Ensure photos are clear and legible.\n` +
                    `• For manual bank top-ups, wait up to 10 mins for approval.\n\n` +
                    `📞 *Need help?* Contact @AdminUsername\n\n` +
                    `📍 *Commands:*\n` +
                    `/start - Main Menu\n` +
                    `/cancel - Reset Flow`;
      bot.editMessageText(text, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'START' }]] }
      });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data.startsWith('DL_PNG_')) {
      const parts = data.split('_');
      const jobId = parts[parts.length - 1];
      if (!jobId) return;
      
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job || !job.output) return bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Job not found.' });

      bot.answerCallbackQuery(callbackQuery.id, { text: '💾 Downloading high-quality file...' });
      
      const parts_output = job.output.split(',');
      const base64Data = parts_output[1];
      if (!base64Data) return;
      
      const buffer = Buffer.from(base64Data, 'base64');

      await bot.sendDocument(chatId, buffer, {
        caption: '📁 *High-Quality PNG*\nBest for printing on ID cards.',
        parse_mode: 'Markdown'
      }, { filename: `EthioID_${jobId}.png`, contentType: 'image/png' });
    }

  } catch (err) {
    console.error('[Bot] Callback error:', err);
    bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Error processing request.' });
  }
});

bot.on('message', async (msg: TelegramBot.Message) => {
  if (msg.text?.startsWith('/')) return;

  try {
    const { user } = await getOrCreateUser(msg);
    const chatId = msg.chat.id;

    if (user.state === 'WAIT_FRONT' || user.state === 'WAIT_BACK' || user.state === 'WAIT_THIRD') {
      if (!msg.photo || msg.photo.length === 0) {
        return bot.sendMessage(chatId, '⚠️ Please send an image file.');
      }

      const photo = msg.photo[msg.photo.length - 1];
      if (!photo) return;
      const file = await bot.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
      
      const field = user.state === 'WAIT_FRONT' ? 'frontPath' : user.state === 'WAIT_BACK' ? 'backPath' : 'thirdPath';
      
      await prisma.tempUpload.upsert({
        where: { userId: user.id },
        update: { [field]: fileUrl },
        create: { userId: user.id, [field]: fileUrl }
      });

      if (user.state === 'WAIT_FRONT') {
        await prisma.user.update({ where: { id: user.id }, data: { state: 'WAIT_BACK' } });
        bot.sendMessage(chatId, '📷 *Step 2/3*\nPlease send the **BACK** screenshot of the ID', { 
          parse_mode: 'Markdown',
          reply_markup: cancelMenuMarkup
        });
      } else if (user.state === 'WAIT_BACK') {
        await prisma.user.update({ where: { id: user.id }, data: { state: 'WAIT_THIRD' } });
        bot.sendMessage(chatId, '📷 *Step 3/3*\nPlease send the **PROFILE** screenshot', { 
          parse_mode: 'Markdown',
          reply_markup: cancelMenuMarkup
        });
      } else if (user.state === 'WAIT_THIRD') {
        await prisma.user.update({ where: { id: user.id }, data: { state: 'PROCESSING' } });
        bot.sendMessage(chatId, '⏳ *Processing formatting...*\nUsually takes ~10 seconds.', { parse_mode: 'Markdown' });

        try {
          const temp = await prisma.tempUpload.findUnique({ where: { userId: user.id } });
          if (!temp || !temp.frontPath || !temp.backPath || !temp.thirdPath) throw new Error('Missing photos');

          const [f, b, t] = await Promise.all([
            fetch(temp.frontPath).then(res => res.arrayBuffer()),
            fetch(temp.backPath).then(res => res.arrayBuffer()),
            fetch(temp.thirdPath).then(res => res.arrayBuffer())
          ]);

          await deductCredits(user.id, 1);
          const { image, format } = await generateID(Buffer.from(f), Buffer.from(b), Buffer.from(t));

          const job = await prisma.job.create({
            data: {
              userId: user.id,
              status: 'SUCCESS',
              cost: 1,
              output: `data:image/${format};base64,${image.toString('base64')}`
            }
          });

          await bot.sendPhoto(chatId, image, {
            caption: `✅ *ID Formatted Successfully*\n\n🖨️ *Ready for Printing*\n📐 Correct size & margins applied.\n\n💳 1 credit deducted.`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🔄 Format Another', callback_data: 'GEN_ID' },
                  { text: '🏠 Home', callback_data: 'START' }
                ]
              ]
            }
          });

        } catch (err: any) {
          console.error('[Bot] Generation Error:', err);
          bot.sendMessage(chatId, `❌ *Formatting failure*\n${err.message || 'Please try again.'}`, { parse_mode: 'Markdown' });
        } finally {
          await prisma.user.update({ where: { id: user.id }, data: { state: 'IDLE' } });
          await prisma.tempUpload.delete({ where: { userId: user.id } }).catch(() => {});
        }
      }
      return;
    }

    if (user.state === 'WAIT_PAYMENT_PROOF') {
      const textProof = msg.text;
      const photoProof = msg.photo ? msg.photo[msg.photo.length - 1]?.file_id : null;

      if (!textProof && !photoProof) {
        return bot.sendMessage(chatId, '⚠️ Please send a screenshot or transaction reference.');
      }

      await createPayment(user.id, {
        packageId: user.pendingPackageId || 'unknown',
        amount: 0,
        credits: 0,
        method: 'MANUAL',
        referenceText: textProof || 'Photo proof submitted',
        proofUrl: photoProof || ''
      });

      await prisma.user.update({ where: { id: user.id }, data: { state: 'IDLE' } });
      bot.sendMessage(chatId, '⏳ *Payment submitted*\nYour payment is under review.', { parse_mode: 'Markdown' });
      return;
    }

  } catch (err) {
    console.error('[Bot] Message error:', err);
  }
});

console.log('🤖 Telegram bot (node-telegram-bot-api) is running...');

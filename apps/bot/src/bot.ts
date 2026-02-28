import TelegramBot from 'node-telegram-bot-api';
import { config } from './config.js';
import prisma from './lib/prisma.js';
import * as api from './api.js';
import express from 'express';

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// --- Keyboards ---

const mainMenuMarkup: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: '🪪 Generate ID', callback_data: 'GEN_ID' }],
    [{ text: '💳 Buy Credits', callback_data: 'TOP_UP' }, { text: '📂 History', callback_data: 'HISTORY' }],
    [{ text: '📞 Support', callback_data: 'HELP' }]
  ]
};

const cancelMenuMarkup: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: '❌ Cancel & Reset', callback_data: 'START' }]]
};

// --- Helpers ---

async function syncUser(msg: TelegramBot.Message | TelegramBot.CallbackQuery) {
    const from = msg.from;
    if (!from) throw new Error('No user data');
    return await api.getOrCreateBotUser(from.id, from.username, from.first_name);
}

// --- Handlers ---

bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
  try {
    const user = await syncUser(msg);
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
    const user = await syncUser(msg);
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
    const user = await syncUser(msg);
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
    const user = await syncUser(callbackQuery);

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
      const text = `💳 *Buy Credits*\n\n` +
                   `Select a package to continue:\n\n` +
                   `🔹 1 ID — 50 ETB\n` +
                   `🔹 10 IDs — 450 ETB\n` +
                   `🔹 40 IDs — 1400 ETB\n\n` +
                   `Click below to select:`;
      
      const topupMarkup: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
            [{ text: '🔹 1 ID (50 ETB)', callback_data: 'PKG_1' }],
            [{ text: '🔹 10 IDs (450 ETB)', callback_data: 'PKG_10' }],
            [{ text: '🔹 40 IDs (1400 ETB)', callback_data: 'PKG_40' }],
            [{ text: '⬅️ Back', callback_data: 'START' }]
        ]
      };

      bot.editMessageText(text, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        reply_markup: topupMarkup
      });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data === 'PROOF_SCREENSHOT') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'WAIT_PAYMENT_PROOF' }
      });
      bot.sendMessage(chatId, '📷 Please send a screenshot of your payment transfer.', {
        reply_markup: cancelMenuMarkup
      });
      bot.answerCallbackQuery(callbackQuery.id);
    }
    
    if (data.startsWith('DL_PNG_')) {
      const jobId = data.replace('DL_PNG_', '');
      try {
          bot.answerCallbackQuery(callbackQuery.id, { text: '⏳ Downloading HD PNG...' });
          const imageBuffer = await api.downloadBotResult(jobId);
          await bot.sendDocument(chatId, imageBuffer, {
              caption: `✅ *Raw Uncompressed PNG*`,
              parse_mode: 'Markdown'
          }, {
              filename: `Ethiopian_ID_${jobId.substring(0, 6)}.png`,
              contentType: 'image/png'
          });
      } catch (err) {
          bot.answerCallbackQuery(callbackQuery.id, { text: '❌ File expired or unavailable.', show_alert: true });
      }
    }


    if (data === 'PROOF_TEXT') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'WAIT_PROOF_MODE' }
      });
      bot.sendMessage(chatId, '✍️ Please send the **Transaction ID** or **Reference Text** of your payment.', { 
        parse_mode: 'Markdown', 
        reply_markup: cancelMenuMarkup 
      });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data.startsWith('PKG_')) {
      const pkgId = data.split('_')[1];
      const text = `🧾 *Order Details*\n\n` +
                   `Package ID: *${pkgId}*\n\n` +
                   `📍 *Payment Instructions*\n` +
                   `Send payment to:\n` +
                   `🏦 *Bank:* Telebirr /\n` +
                   `🔢 *Account:* 1000xxxxxx\n` +
                   `👤 *Name:* National ID Services\n\n` +
                   `📸 *Final Step:*\n` +
                   `How would you like to provide proof?`;
      
      const proofChoiceMarkup: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '📸 Upload Screenshot', callback_data: 'PROOF_SCREENSHOT' }],
          [{ text: '✍️ Transaction Reference / ID', callback_data: 'PROOF_TEXT' }],
          [{ text: '⬅️ Back', callback_data: 'TOP_UP' }]
        ]
      };

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          pendingPackageId: pkgId || null
        }
      });

      bot.editMessageText(text, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        reply_markup: proofChoiceMarkup
      });
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

  } catch (err) {
    console.error('[Bot] Callback error:', err);
    bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Error processing request.' });
  }
});

bot.on('message', async (msg: TelegramBot.Message) => {
  if (msg.text?.startsWith('/')) return;

  try {
    const user = await syncUser(msg);
    const chatId = msg.chat.id;

    if (user.state === 'WAIT_FRONT' || user.state === 'WAIT_BACK' || user.state === 'WAIT_THIRD') {
      if (!msg.photo || msg.photo.length === 0) {
        return bot.sendMessage(chatId, '⚠️ Please send an image file.');
      }

      const photo = msg.photo[msg.photo.length - 1];
      if (!photo) return;
      const file = await bot.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
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
        const processingMsg = await bot.sendMessage(chatId, '⏳ *Processing formatting...*\nUsually takes ~10 seconds.', { parse_mode: 'Markdown' });

        try {
          const temp = await prisma.tempUpload.findUnique({ where: { userId: user.id } });
          if (!temp || !temp.frontPath || !temp.backPath || !temp.thirdPath) throw new Error('Missing photos');

          const [f, b, t] = await Promise.all([
            fetch(temp.frontPath).then(res => res.arrayBuffer()).then(ab => Buffer.from(ab)),
            fetch(temp.backPath).then(res => res.arrayBuffer()).then(ab => Buffer.from(ab)),
            fetch(temp.thirdPath).then(res => res.arrayBuffer()).then(ab => Buffer.from(ab))
          ]);

          const { jobId } = await api.createBotJob(user.id, f, b, t);

          let statusResult = await api.getBotJobStatus(jobId);

          let attempts = 0;
          while ((statusResult?.status === 'PENDING' || statusResult?.status === 'PROCESSING') && attempts < 20) {
              await new Promise(r => setTimeout(r, 2000));
              statusResult = await api.getBotJobStatus(jobId);
              attempts++;
          }

          if (statusResult?.status === 'SUCCESS') {
              const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
              const creditsLeft = updatedUser?.credits || 0;

              const imageBuffer = await api.downloadBotResult(jobId);
              
              // Send compressed Photo by default
              await bot.sendDocument(chatId, imageBuffer, {
                caption: `✅ *ID Formatted Successfully*\n\n🖨️ *Ready for Printing*\n📐 Correct size & margins applied.\n\n💳 *${creditsLeft} credits remaining.*`,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: '⬇️ Download HD PNG', callback_data: `DL_PNG_${jobId}` }
                    ],
                    [
                      { text: '🔄 Format Another', callback_data: 'GEN_ID' },
                      { text: '💳 Top Up', callback_data: 'TOP_UP' }
                    ],
                    [
                      { text: '🏠 Home', callback_data: 'START' }
                    ]
                  ]
                }
              }, {
                filename: `Ethiopian_ID_${jobId.substring(0, 6)}.jpeg`,
                contentType: 'image/jpeg'
              });
          } else {
              console.error('[Bot] Job did not reach SUCCESS. Final status:', statusResult);
              throw new Error(`Processing failed (Status: ${statusResult?.status || 'UNKNOWN'}).`);
          }

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
      const photo = msg.photo ? msg.photo[msg.photo.length - 1] : null;
      if (!photo) {
        return bot.sendMessage(chatId, '⚠️ Please send a screenshot of the payment proof.');
      }

      const file = await bot.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      bot.sendMessage(chatId, '⏳ *Submitting proof...*', { parse_mode: 'Markdown' });

      try {
        await api.submitTopUpRequest(user.id, user.pendingPackageId || '1', buffer);
        await prisma.user.update({ where: { id: user.id }, data: { state: 'IDLE' } });
        bot.sendMessage(chatId, '✅ *Success!*\nYour payment has been submitted for review. An admin will approve it shortly.', { parse_mode: 'Markdown', reply_markup: mainMenuMarkup });
      } catch (err) {
        console.error('Failed to submit topup proof:', err);
        bot.sendMessage(chatId, '❌ Failed to submit payment proof. Please try again or contact support.');
      }
      return;
    }

    if (user.state === 'WAIT_PROOF_MODE') {
      if (!msg.text) {
        return bot.sendMessage(chatId, '⚠️ Please send a text reference or ID.');
      }

      bot.sendMessage(chatId, '⏳ *Submitting reference...*', { parse_mode: 'Markdown' });

      try {
        await api.submitTopUpRequest(user.id, user.pendingPackageId || '1', null, msg.text);
        await prisma.user.update({ where: { id: user.id }, data: { state: 'IDLE' } });
        bot.sendMessage(chatId, '✅ *Success!*\nYour transaction ID has been submitted for review. An admin will approve it shortly.', { parse_mode: 'Markdown', reply_markup: mainMenuMarkup });
      } catch (err) {
        console.error('Failed to submit topup reference:', err);
        bot.sendMessage(chatId, '❌ Failed to submit. Please try again or contact support.');
      }
      return;
    }

  } catch (err) {
    console.error('[Bot] Message error:', err);
  }
});

console.log('🤖 Telegram bot (node-telegram-bot-api) is running...');

// --- Internal Notification Server ---
const app = express();
app.use(express.json());

app.post('/notify', async (req, res) => {
  const { telegramId, message, status } = req.body;
  const secret = req.headers['x-bot-secret'];

  if (secret !== config.BOT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!telegramId || !message) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const icon = status === 'APPROVED' ? '✅' : status === 'REJECTED' ? '❌' : '🔔';
    await bot.sendMessage(telegramId, `${icon} *Payment Update*\n\n${message}`, { parse_mode: 'Markdown' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Bot Notify Error]:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

const PORT = 5005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Internal Bot Listener running on port ${PORT}`);
});

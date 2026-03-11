import TelegramBot from 'node-telegram-bot-api';
import { config } from './config.js';
import prisma from './lib/prisma.js';
import * as api from './api.js';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { t } from './i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// --- Asset Paths ---
const ASSETS_DIR = path.resolve(__dirname, '../assets');
const GUIDE_FRONT = path.join(ASSETS_DIR, 'guide_front.jpg');
const GUIDE_BACK = path.join(ASSETS_DIR, 'guide_back.jpg');
const GUIDE_PROFILE = path.join(ASSETS_DIR, 'guide_profile.jpg');

// --- Keyboards ---

const getMainMenuMarkup = (lang: string): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: t('btn_gen_id', lang), callback_data: 'GEN_ID' }],
    [{ text: t('btn_buy_credits', lang), callback_data: 'TOP_UP' }, { text: t('btn_history', lang), callback_data: 'HISTORY' }],
    [{ text: t('btn_language', lang), callback_data: 'CHANGE_LANG' }, { text: t('btn_support', lang), callback_data: 'HELP' }]
  ]
});

const getCancelMenuMarkup = (lang: string): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: t('btn_cancel', lang), callback_data: 'START' }]]
});

// --- Helpers ---

function safeEditMessageText(chatId: number, messageId: number, text: string, options?: TelegramBot.EditMessageTextOptions) {
  bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...options }).catch(async (err: any) => {
    if (err.message && (err.message.includes('there is no text in the message to edit') || err.message.includes('message to edit not found'))) {
      await bot.deleteMessage(chatId, messageId).catch(() => {});
      const sendOptions: any = { ...options };
      delete sendOptions.chat_id;
      delete sendOptions.message_id;
      bot.sendMessage(chatId, text, sendOptions).catch(console.error);
    } else if (err.message && err.message.includes('message is not modified')) {
      // Ignore
    } else {
      console.error('[Bot] Edit message error:', err.message);
    }
  });
}

async function syncUser(msg: TelegramBot.Message | TelegramBot.CallbackQuery) {
    const from = msg.from;
    if (!from) throw new Error('No user data');
    return await api.getOrCreateBotUser(from.id, from.username, from.first_name);
}

// --- Handlers ---

bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
  try {
    const user = await syncUser(msg);
    
    if (!user.language) {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'WAIT_LANGUAGE' }
      });
      bot.sendMessage(msg.chat.id, t('choose_language', 'en'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🇺🇸 English', callback_data: 'LANG_EN' }],
            [{ text: '🇪🇹 አማርኛ', callback_data: 'LANG_AM' }]
          ]
        }
      });
      return;
    }

    const text = t('start_msg', user.language, { credits: user.credits.toString() });
    
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown', reply_markup: getMainMenuMarkup(user.language) });
  } catch (err) {
    console.error('[Bot] Start error:', err);
  }
});

bot.onText(/\/language/, async (msg: TelegramBot.Message) => {
  try {
    const user = await syncUser(msg);
    await prisma.user.update({
      where: { id: user.id },
      data: { state: 'WAIT_LANGUAGE' }
    });
    bot.sendMessage(msg.chat.id, t('choose_language', user.language || 'en'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇺🇸 English', callback_data: 'LANG_EN' }],
          [{ text: '🇪🇹 አማርኛ', callback_data: 'LANG_AM' }]
        ]
      }
    });
  } catch (err) {
    console.error('[Bot] Lang error:', err);
  }
});

bot.onText(/\/cancel/, async (msg: TelegramBot.Message) => {
  try {
    const user = await syncUser(msg);
    await prisma.user.update({
      where: { id: user.id },
      data: { state: 'IDLE' }
    });
    const lang = user.language || 'en';
    bot.sendMessage(msg.chat.id, t('action_cancelled', lang), { parse_mode: 'Markdown', reply_markup: getMainMenuMarkup(lang) });
  } catch (e) {
    // silently fail
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

    const lang = user.language || 'en';

    if (data === 'LANG_EN' || data === 'LANG_AM') {
      const selectedLang = data === 'LANG_EN' ? 'en' : 'am';
      await prisma.user.update({
        where: { id: user.id },
        data: { language: selectedLang, state: 'IDLE' }
      });
      safeEditMessageText(chatId, message.message_id, t('lang_changed', selectedLang));
      
      const startText = t('start_msg', selectedLang, { credits: user.credits.toString() });
      bot.sendMessage(chatId, startText, { parse_mode: 'Markdown', reply_markup: getMainMenuMarkup(selectedLang) });
      return bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

    if (data === 'START') {
      const text = t('start_msg', lang, { credits: user.credits.toString() });
      safeEditMessageText(chatId, message.message_id, text, { 
        parse_mode: 'Markdown', 
        reply_markup: getMainMenuMarkup(lang) 
      });
      return bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

    if (data === 'CHANGE_LANG') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'WAIT_LANGUAGE' }
      });
      const text = t('choose_language', lang);
      const keyboard = {
        inline_keyboard: [
          [{ text: '🇺🇸 English', callback_data: 'LANG_EN' }],
          [{ text: '🇪🇹 አማርኛ', callback_data: 'LANG_AM' }],
          [{ text: t('btn_back', lang), callback_data: 'START' }]
        ]
      };
      safeEditMessageText(chatId, message.message_id, text, {
        reply_markup: keyboard
      });
      return bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

    if (data === 'GEN_ID') {
      if (user.credits < 1) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: t('not_enough_credits', lang), show_alert: true }).catch(console.error);
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'WAIT_FRONT' }
      });

      const caption = t('step1_caption', lang);
      if (fs.existsSync(GUIDE_FRONT)) {
          bot.sendPhoto(chatId, GUIDE_FRONT, {
              caption,
              parse_mode: 'Markdown',
              reply_markup: getCancelMenuMarkup(lang)
          });
      } else {
          bot.sendMessage(chatId, caption, { 
              parse_mode: 'Markdown',
              reply_markup: getCancelMenuMarkup(lang)
          });
      }
      return bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

    if (data === 'TOP_UP') {
      const text = t('menu_topup', lang);
      
      const topupMarkup: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
            [{ text: t('btn_pkg_p1', lang), callback_data: 'PKG_p1' }],
            [{ text: t('btn_pkg_p2', lang), callback_data: 'PKG_p2' }],
            [{ text: t('btn_pkg_p3', lang), callback_data: 'PKG_p3' }],
            [{ text: t('btn_pkg_p4', lang), callback_data: 'PKG_p4' }],
            [{ text: t('btn_pkg_p5', lang), callback_data: 'PKG_p5' }],
            [{ text: t('btn_back', lang), callback_data: 'START' }]
        ]
      };

      safeEditMessageText(chatId, message.message_id, text, {
        parse_mode: 'Markdown',
        reply_markup: topupMarkup
      });
      bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

    if (data === 'PROOF_SCREENSHOT') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'WAIT_PAYMENT_PROOF' }
      });
      bot.sendMessage(chatId, t('wait_proof_screenshot', lang), {
        reply_markup: getCancelMenuMarkup(lang)
      });
      return bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }
    
    // Removed DL_PNG_ handler


    if (data === 'PROOF_TEXT') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'WAIT_PROOF_MODE' }
      });
      bot.sendMessage(chatId, t('wait_proof_text', lang), { 
        parse_mode: 'Markdown', 
        reply_markup: getCancelMenuMarkup(lang) 
      });
      return bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

    if (data.startsWith('PKG_')) {
      const pkgId = data.split('_')[1];
      const text = t('pkg_details', lang, { pkgId: pkgId || '' });
      
      const proofChoiceMarkup: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: t('btn_proof_screenshot', lang), callback_data: 'PROOF_SCREENSHOT' }],
          [{ text: t('btn_proof_text', lang), callback_data: 'PROOF_TEXT' }],
          [{ text: t('btn_back', lang), callback_data: 'TOP_UP' }]
        ]
      };

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          pendingPackageId: pkgId || null
        }
      });

      safeEditMessageText(chatId, message.message_id, text, {
        parse_mode: 'Markdown',
        reply_markup: proofChoiceMarkup
      });
      bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

    if (data === 'HISTORY') {
      const jobs = await prisma.job.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      let text = t('menu_history', lang);
      if (jobs.length === 0) text += '-';
      else {
        jobs.forEach((job: any, i: number) => {
          text += `${i+1}. ${job.status === 'SUCCESS' ? '✅' : '❌'} Job #${job.id.slice(-4)} — ${new Date(job.createdAt).toLocaleDateString()}\n`;
        });
      }

      safeEditMessageText(chatId, message.message_id, text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: t('btn_back', lang), callback_data: 'START' }]] }
      });
      return bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

    if (data === 'HELP') {
      const text = t('menu_help', lang);
      safeEditMessageText(chatId, message.message_id, text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: t('btn_back', lang), callback_data: 'START' }]] }
      });
      return bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    }

  } catch (err) {
    console.error('[Bot] Callback error:', err);
    bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Error processing request.' }).catch(console.error);
  }
});

bot.on('message', async (msg: TelegramBot.Message) => {
  if (msg.text?.startsWith('/')) return;

  try {
    const user = await syncUser(msg);
    const chatId = msg.chat.id;
    const lang = user.language || 'en';

    if (user.state === 'WAIT_LANGUAGE') {
       return; // Handle exclusively via callback queries
    }

    if (user.state === 'WAIT_FRONT' || user.state === 'WAIT_BACK' || user.state === 'WAIT_THIRD') {
      if (!msg.photo || msg.photo.length === 0) {
        return bot.sendMessage(chatId, t('error_image_expected', lang));
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
        const caption = t('step2_caption', lang);
        if (fs.existsSync(GUIDE_BACK)) {
            bot.sendPhoto(chatId, GUIDE_BACK, {
                caption,
                parse_mode: 'Markdown',
                reply_markup: getCancelMenuMarkup(lang)
            });
        } else {
            bot.sendMessage(chatId, caption, { 
                parse_mode: 'Markdown',
                reply_markup: getCancelMenuMarkup(lang)
            });
        }
      } else if (user.state === 'WAIT_BACK') {
        await prisma.user.update({ where: { id: user.id }, data: { state: 'WAIT_THIRD' } });
        const caption = t('step3_caption', lang);
        if (fs.existsSync(GUIDE_PROFILE)) {
            bot.sendPhoto(chatId, GUIDE_PROFILE, {
                caption,
                parse_mode: 'Markdown',
                reply_markup: getCancelMenuMarkup(lang)
            });
        } else {
            bot.sendMessage(chatId, caption, { 
                parse_mode: 'Markdown',
                reply_markup: getCancelMenuMarkup(lang)
            });
        }
      } else if (user.state === 'WAIT_THIRD') {
        await prisma.user.update({ where: { id: user.id }, data: { state: 'PROCESSING' } });

        try {
          const temp = await prisma.tempUpload.findUnique({ where: { userId: user.id } });
          if (!temp || !temp.frontPath || !temp.backPath || !temp.thirdPath) throw new Error('Missing photos');

          const [f, b, p] = await Promise.all([
            fetch(temp.frontPath).then(res => res.arrayBuffer()).then(ab => Buffer.from(ab)),
            fetch(temp.backPath).then(res => res.arrayBuffer()).then(ab => Buffer.from(ab)),
            fetch(temp.thirdPath).then(res => res.arrayBuffer()).then(ab => Buffer.from(ab))
          ]);

          bot.sendMessage(chatId, "⏳ Submitting to queue...", { parse_mode: 'Markdown' });

          // Trigger the job and get queue metrics
          const jobData = await api.createBotJob(user.id, f, b, p);
          
          let processingText = t('processing', lang);
          if (jobData.queue) {
            const { position, estimatedSeconds } = jobData.queue;
            processingText = `⏳ *In Queue: #${position}*\n\nEstimated wait time: ~${estimatedSeconds} seconds.\n\nWe will notify you automatically when it's ready.`;
          }
          await bot.sendMessage(chatId, processingText, { parse_mode: 'Markdown' });
          
          // No more polling loop!
        } catch (err: any) {
          console.error('[Bot] Generation Error Triggering:', err);
          bot.sendMessage(chatId, t('error_failed_format', lang, { errorMsg: err.message || 'Please try again.' }), { parse_mode: 'Markdown' });
          await prisma.user.update({ where: { id: user.id }, data: { state: 'IDLE' } });
        } finally {
          await prisma.tempUpload.delete({ where: { userId: user.id } }).catch(() => {});
        }
      }
      return;
    }

    if (user.state === 'WAIT_PAYMENT_PROOF') {
      if (msg.text === '/cancel') return bot.sendMessage(chatId, t('action_cancelled', lang));
      const photo = msg.photo ? msg.photo[msg.photo.length - 1] : null;
      if (!photo) {
        return bot.sendMessage(chatId, t('wait_proof_screenshot', lang));
      }

      const file = await bot.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      bot.sendMessage(chatId, t('submitting_proof', lang), { parse_mode: 'Markdown' });

      try {
        await api.submitTopUpRequest(user.id, user.pendingPackageId || '1', buffer);
        await prisma.user.update({ where: { id: user.id }, data: { state: 'IDLE' } });
        bot.sendMessage(chatId, t('payment_submitted', lang), { parse_mode: 'Markdown', reply_markup: getMainMenuMarkup(lang) });
      } catch (err) {
        console.error('Failed to submit topup proof:', err);
      }
      return;
    }

    if (user.state === 'WAIT_PROOF_MODE') {
      if (msg.text === '/cancel') return bot.sendMessage(chatId, t('action_cancelled', lang));
      if (!msg.text) {
        return bot.sendMessage(chatId, t('wait_proof_text', lang));
      }

      bot.sendMessage(chatId, t('submitting_ref', lang), { parse_mode: 'Markdown' });

      try {
        await api.submitTopUpRequest(user.id, user.pendingPackageId || '1', null, msg.text);
        await prisma.user.update({ where: { id: user.id }, data: { state: 'IDLE' } });
        bot.sendMessage(chatId, t('payment_submitted', lang), { parse_mode: 'Markdown', reply_markup: getMainMenuMarkup(lang) });
      } catch (err) {
        console.error('Failed to submit topup reference:', err);
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

app.post('/notify-job', async (req, res) => {
  console.log('[Bot Webhook] Received /notify-job request:', req.body);
  const { telegramId, jobId, status, errorCode, errorMessage } = req.body;
  const secret = req.headers['x-bot-secret'];

  if (secret !== config.BOT_SECRET) {
    console.warn('[Bot Webhook] Unauthorized secret provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!telegramId || !jobId) {
    console.warn('[Bot Webhook] Missing telegramId or jobId');
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
    const lang = user?.language || 'en';

    if (status === 'SUCCESS') {
      const creditsLeft = user?.credits || 0;
      const imageBuffer = await api.downloadBotResult(jobId);

      await bot.sendDocument(telegramId, imageBuffer, {
        caption: t('success_caption', lang, { creditsLeft: creditsLeft.toString() }),
        parse_mode: 'Markdown',
        reply_markup: getMainMenuMarkup(lang)
      }, {
        filename: `Ethiopian_ID_${jobId.substring(0, 6)}.jpeg`,
        contentType: 'image/jpeg'
      });
    } else {
      const msg = errorMessage || 'Processing failed.';
      bot.sendMessage(telegramId, t('error_failed_format', lang, { errorMsg: msg }), { parse_mode: 'Markdown' });
    }

    // Set state back to IDLE
    if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { state: 'IDLE' } });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Bot Job Notify Error]:', err);
    res.status(500).json({ error: 'Failed to notify user' });
  }
});

const PORT = 5005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Internal Bot Listener running on port ${PORT}`);
});

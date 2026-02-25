import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import { processImagesFromTelegram, getUserBalance, getUserHistory, adminTopUpInBot } from './api.js';
import fs from 'fs';
import path from 'path';

const bot = new Telegraf(config.BOT_TOKEN);

// In-memory session state
type UserSession = {
  step: 'IDLE' | 'WAIT_FRONT' | 'WAIT_BACK' | 'WAIT_THIRD' | 'PROCESSING';
  images: string[];
};
const sessions: Record<number, UserSession> = {};

function getSession(userId: number): UserSession {
  if (!sessions[userId]) {
    sessions[userId] = { step: 'IDLE', images: [] };
  }
  return sessions[userId]!;
}

// --- Keyboards ---

const dashboardKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🪪 Generate ID', 'GEN_START')],
  [
    Markup.button.callback('💳 My Balance', 'BALANCE'),
    Markup.button.callback('📜 History', 'HISTORY')
  ],
  [Markup.button.callback('ℹ️ Help', 'HELP')]
]);

const backToDashboardKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🏠 Dashboard', 'DASHBOARD')]
]);

const cancelKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('❌ Cancel', 'DASHBOARD')]
]);

// --- Helpers ---

/**
 * Safely edit a message or reply if editing is not possible (e.g., photo messages)
 * Now ignores deletion to fulfill user request of keeping the generated IDs.
 */
async function smartEditOrReply(ctx: any, text: string, extra: any) {
  try {
    const isCallback = !!ctx.callbackQuery;
    const hasText = isCallback && ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message;

    if (isCallback && hasText) {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...extra });
    } else {
      // For photos or non-callback starts, always send a new message
      // Removing deleteMessage() call to keep the generated ID visible per user request
      await ctx.reply(text, { parse_mode: 'Markdown', ...extra });
    }
  } catch (err) {
    console.error('[Bot] Navigation fallback:', err);
    await ctx.reply(text, { parse_mode: 'Markdown', ...extra });
  }
}

async function showDashboard(ctx: any) {
  const userId = ctx.from.id;
  try {
    const user = await getUserBalance(userId);
    const text = `👋 *Welcome to Ethio ID Generator*\n\n` +
                 `💳 *Credits:* ${user.credits}\n` +
                 `🪪 *IDs generated:* ${user.totalJobs}\n\n` +
                 `Choose an action below:`;
    
    sessions[userId] = { step: 'IDLE', images: [] };
    await smartEditOrReply(ctx, text, dashboardKeyboard);
  } catch (err) {
    console.error('[Bot] Dashboard Error:', err);
    ctx.reply('❌ Failed to connect to server. Please try again later.');
  }
}

// --- Handlers ---

bot.start(async ctx => {
  await showDashboard(ctx);
});

bot.action('DASHBOARD', async ctx => {
  await showDashboard(ctx);
});

bot.action('GEN_START', async ctx => {
  await smartEditOrReply(ctx, 
    `🪪 *ID Generation*\n\n` +
    `• *Cost:* 1 credit\n` +
    `• *Processing time:* ~30 seconds\n` +
    `• *Output:* Print-ready PNG\n\n` +
    `Ready?`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Start', 'GEN_CONFIRM')],
      [Markup.button.callback('❌ Cancel', 'DASHBOARD')]
    ])
  );
});

bot.action('GEN_CONFIRM', async ctx => {
  const userId = ctx.from.id;
  try {
    const user = await getUserBalance(userId);

    if (user.credits < 1) {
      return smartEditOrReply(ctx, 
        `❌ *Insufficient Credits*\n\nYou need 1 credit to generate an ID. Please contact an admin to top up.`,
        backToDashboardKeyboard
      );
    }

    sessions[userId] = { step: 'WAIT_FRONT', images: [] };
    await smartEditOrReply(ctx, 
      `📷 *Upload the FRONT side of the ID*\n\n` +
      `• Clear photo\n` +
      `• No glare\n` +
      `• All edges visible`,
      cancelKeyboard
    );
  } catch (err) {
    ctx.answerCbQuery('❌ Failed to check balance.');
  }
});

bot.action('BALANCE', async ctx => {
  const userId = ctx.from.id;
  try {
    const user = await getUserBalance(userId);
    let msg = `💳 *Your Balance*\n\n` +
              `Credits available: *${user.credits}*\n` +
              `Credits used: *${user.totalJobs}*`;
    
    if (user.role === 'admin') {
      msg += `\n👑 *Role:* Admin`;
    }

    await smartEditOrReply(ctx, msg, Markup.inlineKeyboard([
      [Markup.button.callback('🪪 Generate ID', 'GEN_START')],
      [Markup.button.callback('🏠 Dashboard', 'DASHBOARD')]
    ]));
  } catch (err) {
    ctx.answerCbQuery('❌ Failed to fetch balance.');
  }
});

bot.action('HISTORY', async ctx => {
  const userId = ctx.from.id;
  try {
    const { history } = await getUserHistory(userId);
    let msg = `📜 *Recent ID Jobs*\n\n`;
    
    if (!history || history.length === 0) {
      msg += `No jobs found yet.`;
    } else {
      history.forEach((job: any, i: number) => {
        const icon = job.status === 'success' ? '✅' : '❌';
        const date = new Date(job.createdAt).toLocaleDateString();
        msg += `${i + 1}️⃣ ${icon} ${date}\n`;
      });
    }

    await smartEditOrReply(ctx, msg, backToDashboardKeyboard);
  } catch (err) {
    ctx.answerCbQuery('❌ Failed to fetch history.');
  }
});

bot.action('HELP', async ctx => {
  await smartEditOrReply(ctx, 
    `ℹ️ *Help*\n\n` +
    `• Each ID costs 1 credit\n` +
    `• Credits are deducted only on success\n` +
    `• Images are deleted automatically\n\n` +
    `Need support? Contact admin.`,
    backToDashboardKeyboard
  );
});

bot.action(/^DL_(.+)$/, async ctx => {
  const jobId = ctx.match[1];
  const filePath = path.resolve('..', 'public', 'output', `${jobId}_print_ready.png`);
  
  if (!fs.existsSync(filePath)) {
    return ctx.reply('❌ Sorry, the download link has expired or the file was not found.');
  }

  try {
    await ctx.replyWithDocument({ source: filePath, filename: `Ethiopian_ID_${jobId}.png` });
    ctx.answerCbQuery('📥 Document sent!');
  } catch (err) {
    console.error('[Bot] Download Error:', err);
    ctx.answerCbQuery('❌ Failed to send document.');
  }
});

// Admin commands
bot.command('id', ctx => {
  ctx.reply(`🆔 *Your Telegram ID:* \`${ctx.from.id}\``, { parse_mode: 'Markdown' });
});

bot.command('topup', async ctx => {
  const adminId = ctx.from.id;
  if (!ctx.message || !('text' in ctx.message)) return;
  const args = ctx.message.text.split(' ');
  
  if (args.length < 3) {
    return ctx.reply('❌ Usage: `/topup <telegram_id> <amount>`', { parse_mode: 'Markdown' });
  }

  const targetId = parseInt(args[1]!);
  const amount = parseInt(args[2]!);

  if (isNaN(targetId) || isNaN(amount)) {
    return ctx.reply('❌ Invalid ID or amount.');
  }

  try {
    const result = await adminTopUpInBot(adminId, targetId, amount);
    ctx.reply(`✅ *Top-up Successful!*\nUser: \`${targetId}\`\nNew Balance: ${result.newBalance} credits`, { parse_mode: 'Markdown' });
    bot.telegram.sendMessage(targetId, `🎁 *Credits Received!*\nAn admin added ${amount} credits to your account.\nNew Balance: ${result.newBalance} credits`, { parse_mode: 'Markdown' }).catch(() => {});
  } catch (err: any) {
    console.error(err);
    const errorMsg = err.response?.data?.error;
    if (errorMsg === 'FORBIDDEN_NOT_ADMIN') {
      ctx.reply('❌ *Forbidden:* You are not an admin.');
    } else {
      ctx.reply('❌ Failed to perform top-up.');
    }
  }
});

// Image handlers
bot.on('photo', async ctx => {
  const userId = ctx.from.id;
  const session = getSession(userId);

  if (session.step === 'IDLE' || session.step === 'PROCESSING') return;

  if (!ctx.message || !('photo' in ctx.message)) return;
  const photos = ctx.message.photo;
  const highestRes = photos[photos.length - 1];
  if (!highestRes) return;

  session.images.push(highestRes.file_id);

  if (session.step === 'WAIT_FRONT') {
    session.step = 'WAIT_BACK';
    await ctx.reply('✅ Front received. Now send the **Back** image.', { parse_mode: 'Markdown', ...cancelKeyboard });
  } else if (session.step === 'WAIT_BACK') {
    session.step = 'WAIT_THIRD';
    await ctx.reply('✅ Back received. Finally, send the **Third** image (QR Close-up).', { parse_mode: 'Markdown', ...cancelKeyboard });
  } else if (session.step === 'WAIT_THIRD') {
    session.step = 'PROCESSING';
    try {
      await ctx.reply(`⏳ *Processing your ID...*\n\n• Extracting data\n• Generating photo\n• Rendering print-ready image`, { parse_mode: 'Markdown' });

      const result = await processImagesFromTelegram(ctx, session.images);

      // Use local file source to avoid Telegram 400 IMAGE_PROCESS_FAILED (localhost issue)
      const localPath = path.resolve(process.cwd(), '..', result.printReadyPath);
      console.log(`[Bot] Sending preview from: ${localPath}`);

      const photoSource = fs.existsSync(localPath) ? { source: localPath } : { url: result.printReadyImageUrl };

      await ctx.replyWithPhoto(photoSource, {
        caption: `✅ *ID Generated Successfully!*\n\n💳 1 credit deducted\n📄 Ready for printing`,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📥 Download ID', `DL_${result.jobId}`)],
          [Markup.button.callback('🪪 Generate Another', 'GEN_START')],
          [Markup.button.callback('🏠 Dashboard', 'DASHBOARD')]
        ])
      });

      delete sessions[userId];
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.error;
      
      let msg = `❌ *ID Generation Failed*\n\nReason: \`${errorMessage || 'Unknown error'}\`\n\n💳 No credits were deducted.`;
      
      if (errorMessage === 'INSUFFICIENT_CREDITS') {
        msg = `❌ *Insufficient Credits*\n\nYou need 1 credit to generate an ID.`;
      }

      await ctx.reply(msg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔁 Try Again', 'GEN_START')],
          [Markup.button.callback('🏠 Dashboard', 'DASHBOARD')]
        ])
      });
      delete sessions[userId];
    }
  }
});

bot.on('message', ctx => {
  if (ctx.from.id in sessions && sessions[ctx.from.id]!.step !== 'IDLE') return;
  ctx.reply('👋 Need something? Use the /start command to see the dashboard.', backToDashboardKeyboard);
});

bot.launch().then(() => {
  console.log('🤖 Telegram bot is running (UX Polished Mode)...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

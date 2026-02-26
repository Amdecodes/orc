import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { processImageFromTelegram } from './api.js';
const bot = new Telegraf(config.BOT_TOKEN);
bot.start(ctx => {
    ctx.reply(`📷 Send me a clear ID screenshot.\n\n` +
        `I will generate a clean profile photo for you.\n\n` +
        `⚠️ One image at a time.`);
});
bot.on('photo', async (ctx) => {
    try {
        await ctx.reply('⏳ Processing image...');
        const photos = ctx.message.photo;
        const highestRes = photos[photos.length - 1];
        if (!highestRes) {
            throw new Error('No photo found in message');
        }
        const resultUrl = await processImageFromTelegram(ctx, highestRes.file_id);
        await ctx.replyWithPhoto({ url: resultUrl }, {
            caption: '✅ Done! Here is your processed ID photo.'
        });
    }
    catch (err) {
        console.error(err);
        ctx.reply('❌ Failed to process image. Please try again.');
    }
});
bot.on('message', ctx => {
    ctx.reply('📷 Please send an image.');
});
bot.launch().then(() => {
    console.log('🤖 Telegram bot is running...');
});
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
//# sourceMappingURL=bot.js.map
import axios from 'axios';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { Context } from 'telegraf';
import FormData from 'form-data';

export async function processImagesFromTelegram(ctx: Context, fileIds: string[]) {
  const telegramId = ctx.from?.id;
  if (!telegramId) throw new Error('Could not identify user');

  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  const localPaths: string[] = [];

  // 1. Download all images
  for (const [index, fileId] of fileIds.entries()) {
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    
    const localPath = path.join(tmpDir, `input_${index}_${Date.now()}.jpg`);
    fs.writeFileSync(localPath, response.data);
    localPaths.push(localPath);
  }

  // 2. Prepare FormData
  const form = new FormData();
  if (localPaths[0]) form.append('front', fs.createReadStream(localPaths[0]));
  if (localPaths[1]) form.append('back', fs.createReadStream(localPaths[1]));
  if (localPaths[2]) form.append('third', fs.createReadStream(localPaths[2]));
  form.append('telegramId', telegramId.toString());

  // 3. Send to backend
  const apiResponse = await axios.post(
    `${config.API_BASE_URL}/api/process-id-photo`,
    form,
    { headers: form.getHeaders(), timeout: 60000 } // Longer timeout for full pipeline
  );

  // 4. Cleanup
  localPaths.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

  // 5. Return processed URLs
  // Backend returns { jobId, frontImageUrl, backImageUrl, printReadyImageUrl, data }
  return apiResponse.data;
}

export async function getUserBalance(telegramId: number) {
  const response = await axios.get(`${config.API_BASE_URL}/api/user/balance/${telegramId}`);
  return response.data; // { credits: number, role: string, totalJobs: number }
}

export async function getUserHistory(telegramId: number) {
  const response = await axios.get(`${config.API_BASE_URL}/api/user/history/${telegramId}`);
  return response.data; // { history: Array<{ status: string, createdAt: string }> }
}

export async function adminTopUpInBot(adminTelegramId: number, targetTelegramId: number, amount: number) {
  const response = await axios.post(`${config.API_BASE_URL}/api/admin/topup`, {
    adminTelegramId,
    targetTelegramId,
    amount,
    reason: 'BOT_ADMIN_COMMAND'
  });
  return response.data; // { success: true, newBalance: number }
}

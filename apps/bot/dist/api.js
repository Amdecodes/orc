import axios from 'axios';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { Context } from 'telegraf';
import FormData from 'form-data';
export async function processImageFromTelegram(ctx, fileId) {
    // 1. Get file URL from Telegram
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
    // 2. Download image
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    // Use a predictable temporary directory or the system tmp
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    }
    const tmpPath = path.join(tmpDir, `${Date.now()}.jpg`);
    fs.writeFileSync(tmpPath, response.data);
    // 3. Send to your backend
    const form = new FormData();
    form.append('image', fs.createReadStream(tmpPath));
    const apiResponse = await axios.post(`${config.API_BASE_URL}/api/process-id-photo`, form, { headers: form.getHeaders() });
    // 4. Cleanup
    fs.unlinkSync(tmpPath);
    // 5. Return processed image URL
    return apiResponse.data.outputImageUrl;
}
//# sourceMappingURL=api.js.map
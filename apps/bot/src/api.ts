import axios from 'axios';
import { config } from './config.js';
import FormData from 'form-data';
import fs from 'fs';

const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'x-bot-secret': config.BOT_SECRET || ''
  }
});

export async function getOrCreateBotUser(telegramId: number, username?: string, firstName?: string) {
  const response = await api.post('/api/bot/user/get-or-create', {
    telegramId,
    username,
    firstName
  });
  return response.data;
}

export async function createBotJob(userId: string, front: Buffer, back: Buffer, photo: Buffer) {
  const form = new FormData();
  form.append('userId', userId);
  form.append('front', front, { filename: 'front.jpg' });
  form.append('back', back, { filename: 'back.jpg' });
  form.append('photo', photo, { filename: 'photo.jpg' });

  const response = await api.post('/api/bot/jobs/create', form, {
    headers: form.getHeaders()
  });
  return response.data; // { jobId: string, queue?: { position: number, estimatedSeconds: number, activeWorkers: number } }
}

export async function getBotJobStatus(jobId: string) {
  const response = await api.get(`/api/bot/jobs/${jobId}/status`);
  return response.data; // { id, status, outputPath }
}

export async function downloadBotResult(jobId: string): Promise<Buffer> {
  const response = await api.get(`/api/jobs/download/${jobId}`, {
    responseType: 'arraybuffer'
  });
  return Buffer.from(response.data);
}

export async function submitTopUpRequest(
  userId: string, 
  packageId: string, 
  screenshot: Buffer | null, 
  referenceText?: string
) {
  const form = new FormData();
  form.append('userId', userId);
  form.append('packageId', packageId);
  
  if (screenshot) {
    form.append('screenshot', screenshot, { filename: 'screenshot.jpg' });
  }
  if (referenceText) {
    form.append('referenceText', referenceText);
  }

  const response = await api.post('/api/topup/request', form, {
    headers: form.getHeaders()
  });
  return response.data;
}

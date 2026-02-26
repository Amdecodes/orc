import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { generateID } from './core/generateID.js';
import { IdentityExtractionError } from './core/errors.js';
import prisma from './db.js';
import { 
  getOrCreateUserByTelegramId, 
  hasEnoughCredits, 
  deductCredits, 
  adminTopUp, 
  getUserTotalJobs,
  getUserJobHistory,
  COST_PER_ID 
} from './services/creditService.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// BigInt JSON serialization fix
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Multer setup for temporary uploads
const upload = multer({ dest: 'tmp/uploads/' });

// Create directories if they don't exist
const dirs = ['tmp/uploads', 'public/output'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Endpoint to check user balance
 */
app.get('/api/user/balance/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await getOrCreateUserByTelegramId(telegramId);
    const totalJobs = await getUserTotalJobs(user.id);
    res.json({ 
      credits: user.credits, 
      role: user.role,
      totalJobs 
    });
  } catch (err) {
    console.error('[API Server] Error fetching balance:', err);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

/**
 * Endpoint to get user history
 */
app.get('/api/user/history/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await getOrCreateUserByTelegramId(telegramId);
    const history = await getUserJobHistory(user.id);
    res.json({ history });
  } catch (err) {
    console.error('[API Server] Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * Endpoint for admin to top up user credits
 */
app.post('/api/admin/topup', async (req, res) => {
  const { adminTelegramId, targetTelegramId, amount, reason } = req.body;
  
  try {
    // 1. Verify admin
    const admin = await getOrCreateUserByTelegramId(adminTelegramId);
    if (admin.role !== 'admin') {
      return res.status(403).json({ error: 'FORBIDDEN_NOT_ADMIN' });
    }

    // 2. Get target user
    const targetUser = await getOrCreateUserByTelegramId(targetTelegramId);
    
    // 3. Perform top-up
    await adminTopUp(targetUser.id, parseInt(amount), admin.id, reason || 'BOT_ADMIN_TOPUP');

    res.json({ success: true, newBalance: targetUser.credits + parseInt(amount) });
  } catch (err) {
    console.error('[API Server] Error in top-up:', err);
    res.status(500).json({ error: 'Failed to perform top-up' });
  }
});

/**
 * Endpoint for Telegram Bot Processing (Multi-Image)
 * Expects 'front', 'back', and 'third' fields in multipart form-data
 */
app.post('/api/process-id-photo', upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'third', maxCount: 1 }
]), async (req, res) => {
  const files = req.files;
  const { telegramId } = req.body;
  
  let job = null;
  let user = null;

  try {
    if (!telegramId) {
      return res.status(400).json({ error: 'Missing telegramId' });
    }

    if (!files.front || !files.back || !files.third) {
      return res.status(400).json({ error: 'Missing images. Required: front, back, third.' });
    }

    // 1. Get/Create User & Check Credits
    user = await getOrCreateUserByTelegramId(telegramId);
    if (user.credits < COST_PER_ID) {
      return res.status(403).json({ error: 'INSUFFICIENT_CREDITS', required: COST_PER_ID, balance: user.credits });
    }

    const frontPath = files.front[0].path;
    const backPath = files.back[0].path;
    const thirdPath = files.third[0].path;

    // 2. Create Job in DB
    job = await prisma.iDJob.create({
      data: {
        userId: user.id,
        status: 'pending',
        frontPath,
        backPath
      }
    });

    console.log(`[API Server] Processing job ${job.id} for user ${telegramId}...`);

    // Read files as Buffers for generateID
    const frontBuf = fs.readFileSync(frontPath);
    const backBuf = fs.readFileSync(backPath);
    const thirdBuf = fs.readFileSync(thirdPath);

    // 3. Run Core generateID
    const { image, frontBuffer, backBuffer, data: result } = await generateID(frontBuf, backBuf, thirdBuf);

    // 4. Define Output Paths
    const frontOutPath = `public/output/${job.id}_front.png`;
    const backOutPath = `public/output/${job.id}_back.png`;
    const printReadyPath = `public/output/${job.id}_print_ready.png`;
    
    console.log(`[API Server] Saving rendered images for job ${job.id}...`);

    // 5. Save buffers to disk for public serving
    fs.writeFileSync(frontOutPath, frontBuffer);
    fs.writeFileSync(backOutPath, backBuffer);
    fs.writeFileSync(printReadyPath, image);

    // 6. Deduct Credits
    await deductCredits(user.id, job.id);
    
    // 7. Success Response
    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    res.json({
      jobId: job.id,
      frontImageUrl: `${baseUrl}/output/${job.id}_front.png`,
      backImageUrl: `${baseUrl}/output/${job.id}_back.png`,
      printReadyImageUrl: `${baseUrl}/output/${job.id}_print_ready.png`,
      printReadyPath: printReadyPath, 
      data: result
    });

    // 8. DB Update & Cleanup
    await prisma.iDJob.update({
      where: { id: job.id },
      data: { status: 'success', finalPath: printReadyPath }
    });

    [frontPath, backPath, thirdPath].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    console.log(`[API Server] Successfully finished job ${job.id}.`);

  } catch (err) {
    console.error('[API Server] Error processing ID:', err);
    
    const errorCode = err instanceof IdentityExtractionError ? err.code : 'UNKNOWN_ERROR';

    if (job) {
      await prisma.iDJob.update({
        where: { id: job.id },
        data: { status: 'failed', error: err.message }
      }).catch(() => {});
    }

    // Attempt cleanup on error
    if (req.files) {
      Object.values(req.files).flat().forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }

    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: err.message || 'Failed to process ID photo',
        code: errorCode
      });
    }
  }
});


app.listen(port, () => {
  console.log(`🚀 API Server running at http://localhost:${port}`);
  console.log(`📁 Serving static files from /public`);
});

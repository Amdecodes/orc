import fs from 'fs';
import path from 'path';

const TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const OUTPUT_MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

const DIRS_TO_CLEAN = [
  { path: 'tmp/uploads', maxAge: TEMP_MAX_AGE_MS },
  { path: 'public/output', maxAge: OUTPUT_MAX_AGE_MS }
];

function cleanup() {
  const now = Date.now();
  console.log(`[Cleanup] Starting maintenance at ${new Date(now).toISOString()}`);

  DIRS_TO_CLEAN.forEach(dirConfig => {
    const dirPath = path.resolve(dirConfig.path);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);
    let deletedCount = 0;

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > dirConfig.maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${deletedCount} files from ${dirConfig.path}`);
    }
  });

  console.log(`[Cleanup] Maintenance finished.`);
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanup();
}

export default cleanup;

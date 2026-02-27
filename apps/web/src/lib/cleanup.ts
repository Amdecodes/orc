import { readdir, stat, rm, unlink } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "./upload";

const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function startCleanupJob() {
  console.log("Starting 48-hour file cleanup job...");
  
  // Run every hour
  setInterval(async () => {
    try {
      await cleanupDirectory(UPLOAD_DIR);
    } catch (err) {
      console.error("Cleanup job error:", err);
    }
  }, 60 * 60 * 1000); 
}

async function cleanupDirectory(dirPath: string) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively clean subdirectories
        await cleanupDirectory(fullPath);
        
        // After cleaning subdirectories, check if the directory is now empty
        const remaining = await readdir(fullPath);
        if (remaining.length === 0) {
          await rm(fullPath, { recursive: true, force: true }).catch(console.error);
          console.log(`Removed empty directory: ${fullPath}`);
        }
      } else if (entry.isFile()) {
        // Check file age
        try {
          const fileStat = await stat(fullPath);
          const ageMs = Date.now() - fileStat.mtimeMs;
          
          if (ageMs > MAX_AGE_MS) {
            await unlink(fullPath);
            console.log(`Cleaned up expired file: ${fullPath}`);
          }
        } catch (fileErr) {
          console.error(`Error checking/unlinking file ${fullPath}:`, fileErr);
        }
      }
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error(`Error reading directory ${dirPath}:`, err);
    }
  }
}

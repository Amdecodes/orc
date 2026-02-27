import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

// Dedicated directory for uploads
export const UPLOAD_DIR = path.join(process.cwd(), "tmp", "uploads");

export async function saveUploadedFile(file: File, userId: string, slot: string) {
  const userDir = path.join(UPLOAD_DIR, userId);
  
  // Create folder for this user if it doesn't exist
  await mkdir(userDir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}-${slot}${getExtension(file.type)}`;
  const filePath = path.join(userDir, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  // Return the absolute path for backend use
  return filePath;
}

function getExtension(mimeType: string) {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return map[mimeType] ?? ".jpg";
}

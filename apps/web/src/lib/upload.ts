import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

// Dedicated directory for uploads
export const UPLOAD_DIR = path.join(process.cwd(), "tmp", "uploads");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function saveUploadedFile(file: File, userId: string, slot: string) {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit`);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, and WebP images are allowed`);
  }

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

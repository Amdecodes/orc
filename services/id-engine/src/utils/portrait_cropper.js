import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Deterministic portrait extraction for Ethiopian ID screenshots
 * Strategy:
 * 1. Crop top 58% of image (full width)
 * 2. Remove background (rembg)
 * 3. Resize to 600x800 (3:4)
 *
 * @param {Buffer} inputBuffer - original image buffer
 * @returns {Promise<Buffer>} final PNG buffer (transparent background)
 */
export async function extractPortrait(inputBuffer) {
  // ---- STEP 1: Read metadata ----
  const image = sharp(inputBuffer);
  const meta = await image.metadata();

  if (!meta.width || !meta.height) {
    throw new Error("Invalid image metadata");
  }

  // ---- STEP 2: Deterministic vertical crop ----
  const CROP_TOP_RATIO = 0.58; // ← DO NOT CHANGE casually

  const cropHeight = Math.floor(meta.height * CROP_TOP_RATIO);

  const croppedBuffer = await image
    .extract({
      left: 0,
      top: 0,
      width: meta.width,
      height: cropHeight
    })
    .png()
    .toBuffer();

  // ---- STEP 3: Background removal (rembg) ----
  // rembg works best via file path in Node
  const tmpIn = path.join(os.tmpdir(), `portrait_in_${Date.now()}.png`);
  const tmpOut = path.join(os.tmpdir(), `portrait_out_${Date.now()}.png`);

  await fs.writeFile(tmpIn, croppedBuffer);
  
  // Resolve absolute path to root node_modules for @imgly assets
  const rootDir = path.resolve(__dirname, '../../../../');
  const publicPath = `file://${path.join(rootDir, 'node_modules', '@imgly', 'background-removal-node', 'dist')}/`;

  try {
    const result = await removeBackground(tmpIn, {
      publicPath,
      debug: false,
      model: 'small'
    });
    
    // The result from @imgly/background-removal-node can be a Blob, Buffer, or other things depending on version/environment.
    // In node environment with @imgly/background-removal-node, it often returns a Blob or standard Buffer.
    // Let's handle it safely.
    let outBuffer;
    if (result instanceof Buffer) {
      outBuffer = result;
    } else if (typeof result.arrayBuffer === 'function') {
      outBuffer = Buffer.from(await result.arrayBuffer());
    } else {
      // Fallback if it wrote to disk (some versions/configs)
      outBuffer = await fs.readFile(tmpOut).catch(() => null);
      if (!outBuffer) outBuffer = Buffer.from(result);
    }

    // ---- STEP 4: Final normalization ----
    const finalBuffer = await sharp(outBuffer)
      .resize(600, 800, {
        fit: "cover",
        position: "centre"
      })
      .png()
      .toBuffer();

    return finalBuffer;

  } finally {
    // ---- Cleanup ----
    await fs.unlink(tmpIn).catch(() => {});
    await fs.unlink(tmpOut).catch(() => {});
  }
}

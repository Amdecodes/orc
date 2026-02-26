import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Template lives in <project-root>/templates/ (2 levels up from src/core/image/)
const TEMPLATE_PATH = path.resolve(__dirname, '../../../templates/id-print.html');

const CLIP = { x: 0, y: 0, width: 2102, height: 638 };

/** Shared: launch browser and take a screenshot, returning Buffer */
async function _renderLayout(frontBase64, backBase64) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const html = template
    .replace('{{FRONT_IMAGE}}', `data:image/png;base64,${frontBase64}`)
    .replace('{{BACK_IMAGE}}',  `data:image/png;base64,${backBase64}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({
    viewport: { width: CLIP.width, height: CLIP.height },
    deviceScaleFactor: 2
  });

  try {
    await page.setContent(html);
    await page.waitForTimeout(500);
    const buf = await page.screenshot({ type: 'png', clip: CLIP });
    return buf;
  } finally {
    await browser.close();
  }
}

/**
 * File-writing variant (used by api_server.js).
 * Writes both PNG and JPG to disk.
 *
 * @param {string} frontPath Path to the front ID image.
 * @param {string} backPath Path to the back ID image.
 * @param {string} outputPath Target path for the composite PNG.
 */
export async function renderPrintReady(frontPath, backPath, outputPath) {
  const frontBase64 = fs.readFileSync(frontPath).toString('base64');
  const backBase64  = fs.readFileSync(backPath).toString('base64');
  const buf = await _renderLayout(frontBase64, backBase64);

  fs.writeFileSync(outputPath, buf);
  // JPG version
  const jpgPath = outputPath.replace('.png', '.jpg');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: CLIP.width, height: CLIP.height }, deviceScaleFactor: 2 });
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const html = template
    .replace('{{FRONT_IMAGE}}', `data:image/png;base64,${frontBase64}`)
    .replace('{{BACK_IMAGE}}',  `data:image/png;base64,${backBase64}`);
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 95, clip: CLIP });
  await browser.close();

  console.log(`[renderPrintReady] ✅ Print-ready layout saved to ${outputPath}`);
}

/**
 * Buffer-returning variant (used by generateID — no file I/O).
 *
 * @param {Buffer} frontBuf PNG buffer of the rendered front card.
 * @param {Buffer} backBuf  PNG buffer of the rendered back card.
 * @returns {Promise<Buffer>} Print-ready PNG buffer.
 */
export async function composePrintBuffer(frontBuf, backBuf) {
  const frontBase64 = frontBuf.toString('base64');
  const backBase64  = backBuf.toString('base64');
  return await _renderLayout(frontBase64, backBase64);
}

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Template lives in <project-root>/templates/ (5 levels up from src/core/image/)
const TEMPLATE_PATH = path.resolve(__dirname, '../../../../../templates/id-print.html');

const CLIP = { x: 0, y: 0, width: 5944, height: 1778 };

/** Shared: launch browser and take a screenshot, returning Buffer */
async function _renderLayout(frontBase64, backBase64) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const html = template
    .replace('{{FRONT_IMAGE}}', `data:image/jpeg;base64,${frontBase64}`)
    .replace('{{BACK_IMAGE}}',  `data:image/jpeg;base64,${backBase64}`);

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
    const buf = await page.screenshot({ type: 'jpeg', quality: 95, clip: CLIP });
    return buf;
  } finally {
    await browser.close();
  }
}

export async function renderPrintReady(frontPath, backPath, outputPath) {
  const frontBase64 = fs.readFileSync(frontPath).toString('base64');
  const backBase64  = fs.readFileSync(backPath).toString('base64');
  const buf = await _renderLayout(frontBase64, backBase64);

  fs.writeFileSync(outputPath, buf);

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

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/**
 * Renders a print-ready composite image of front and back ID cards.
 * 
 * @param {string} frontPath Path to the front ID image.
 * @param {string} backPath Path to the back ID image.
 * @param {string} outputPath Target path for the final composite image.
 */
export async function renderPrintReady(
  frontPath,
  backPath,
  outputPath
) {
  const templatePath = path.join(process.cwd(), 'templates/id-print.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  const frontBase64 = fs.readFileSync(frontPath).toString('base64');
  const backBase64  = fs.readFileSync(backPath).toString('base64');

  const html = template
    .replace('{{FRONT_IMAGE}}', `data:image/png;base64,${frontBase64}`)
    .replace('{{BACK_IMAGE}}', `data:image/png;base64,${backBase64}`);

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage({
    viewport: { width: 2102, height: 638 },
    deviceScaleFactor: 2
  });

  await page.setContent(html);
  // Wait a bit for images to decode/render
  await page.waitForTimeout(500);

  // PNG (print-safe)
  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 2102, height: 638 }
  });

  // JPG version (optional but requested in plan)
  const jpgPath = outputPath.replace('.png', '.jpg');
  await page.screenshot({
    path: jpgPath,
    type: 'jpeg',
    quality: 95,
    clip: { x: 0, y: 0, width: 2102, height: 638 }
  });

  await browser.close();
  console.log(`[renderPrintReady] ✅ Print-ready layout saved to ${outputPath}`);
}

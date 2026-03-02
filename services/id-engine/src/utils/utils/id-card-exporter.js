/**
 * id-card-exporter.js  (v2 — production)
 *
 * Renders pipeline JSON output onto the front/back ID card template images.
 * Canvas: 1011 × 638  (fixed, independent of image dimensions)
 * Uses node-canvas for precise font rendering (Droid Sans Ethiopic + Liberation Sans).
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '../../../');

// ─── Register fonts (real TrueType system fonts) ──────────────────────────────
const FONT_ETH_REG  = '/usr/share/fonts/google-droid-sans-fonts/DroidSansEthiopic-Regular.ttf';
const FONT_ETH_BOLD = '/usr/share/fonts/google-droid-sans-fonts/DroidSansEthiopic-Bold.ttf';
const FONT_LAT_REG  = '/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf';
const FONT_LAT_BOLD = '/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf';
const FONT_MON_REG  = '/usr/share/fonts/liberation-mono-fonts/LiberationMono-Regular.ttf';
const FONT_MON_BOLD = '/usr/share/fonts/liberation-mono-fonts/LiberationMono-Bold.ttf';

registerFont(FONT_ETH_REG,  { family: 'DroidEthiopic', weight: 'normal' });
registerFont(FONT_ETH_BOLD, { family: 'DroidEthiopic', weight: 'bold'   });
registerFont(FONT_LAT_REG,  { family: 'Liberation',    weight: 'normal' });
registerFont(FONT_LAT_BOLD, { family: 'Liberation',    weight: 'bold'   });
registerFont(FONT_MON_REG,  { family: 'LiberationMono', weight: 'normal' });
registerFont(FONT_MON_BOLD, { family: 'LiberationMono', weight: 'bold'  });

// ─── Canvas size (fixed) ──────────────────────────────────────────────────────
const CANVAS_W = 1011;
const CANVAS_H = 638;

// ─── Design tokens ────────────────────────────────────────────────────────────
const CLR_PRIMARY   = '#0d1f3c';
const CLR_VALUE     = '#111111';

// Font sizes (multiplied by 3.2 for pt -> px)
const FS_MAIN     = 6.5 * 3.2;   // 20.8  — Amh name, En name, DOB, sex, expiry, FAN, phone
const FS_ISSUE    = 4.7 * 3.2;   // 15.04 — date of issue (rotated, left edge)
const FS_NAT      = 7.3 * 3.2;   // 23.36 — nationality
const FS_ADDR_AM  = 6.4 * 3.2;   // 20.48 — address Amharic lines
const FS_ADDR_EN  = 7.1 * 3.2;   // 22.72 — address English lines
const FS_FIN      = 5.5 * 3.2;   // 17.6  — FIN

// ─── Utility ──────────────────────────────────────────────────────────────────

function drawText(ctx, text, x, y, { size = 14, weight = 'normal', color = CLR_VALUE, align = 'left', isEthiopic = false, isMono = false } = {}) {
  if (!text || String(text).trim() === '') return;
  let family;
  if (isEthiopic) family = 'DroidEthiopic';
  else if (isMono) family = 'LiberationMono';
  else             family = 'Liberation';
  ctx.font      = `${weight} ${size}px '${family}'`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(String(text), x, y);
}

function hasEthiopic(s) {
  return /[\u1200-\u137F\u2D80-\u2DDF\uAB00-\uAB2F]/u.test(String(s));
}

function drawMixedLine(ctx, text, x, y, opts = {}) {
  if (!text || String(text).trim() === '') return;
  const parts = String(text).split('|');
  let cursor  = x;
  parts.forEach((part, i) => {
    const t      = part.trim();
    const family = hasEthiopic(t) ? 'DroidEthiopic' : 'Liberation';
    ctx.font      = `${opts.weight || 'normal'} ${opts.size || 14}px '${family}'`;
    ctx.fillStyle = opts.color || CLR_VALUE;
    ctx.textAlign = 'left';
    ctx.fillText(t, cursor, y);
    const w = ctx.measureText(t).width;
    cursor += w;
    if (i < parts.length - 1) {
      ctx.font = `${opts.weight || 'normal'} ${opts.size || 14}px 'Liberation'`;
      ctx.fillText(' | ', cursor, y);
      cursor += ctx.measureText(' | ').width;
    }
  });
}

// ─── FRONT ────────────────────────────────────────────────────────────────────

async function renderFront(data, frontImgPath, outputPath) {
  console.log('[Export] Rendering front...');

  const p  = data.personal    || {};
  const v  = data.validity    || {};
  const id = data.identifiers || {};

  const namAm = (p.name    || {}).am || '';
  const namEn = (p.name    || {}).en || '';
  const dobEc = (p.dob     || {}).ec || '';
  const dobGc = (p.dob     || {}).gc || '';
  const sexAm = (p.gender  || {}).am || '';
  const sexEn = (p.gender  || {}).en || '';
  const expEc = (v.expiry  || {}).ec || '';
  const expGc = (v.expiry  || {}).gc || '';
  const issEc = (v.issue   || {}).ec || '';
  const issGc = (v.issue   || {}).gc || '';
  const fan   = id.fan  || '';

  const baseImg = await loadImage(frontImgPath);

  // Fixed canvas: 1011 x 638
  const canvas  = createCanvas(CANVAS_W, CANVAS_H);
  const ctx     = canvas.getContext('2d');

  // Scale background to fill canvas exactly
  ctx.drawImage(baseImg, 0, 0, CANVAS_W, CANVAS_H);

  // ── Portrait photo (main)  — X:89 Y:151 W:273 H:405 ──
  const portraitFile = path.join(ROOT, 'output', 'portrait_export.png');
  if (fs.existsSync(portraitFile)) {
    const w = 273, h = 405;
    const grayBuf = await sharp(portraitFile)
      .resize(w, h, { fit: 'cover', position: 'top' })
      .grayscale()
      .png()
      .toBuffer();
    const portImg = await loadImage(grayBuf);
    ctx.drawImage(portImg, 89, 151, w, h);
  }

  // ── Amharic name — X:411 Y:180 ──
  drawText(ctx, namAm, 411, 180, { size: FS_MAIN, weight: 'bold', color: CLR_VALUE, isEthiopic: true });

  // ── English name — X:411 Y:214 ──
  drawText(ctx, namEn, 411, 214, { size: FS_MAIN, weight: 'bold', color: CLR_VALUE });

  // ── Date of Birth (14/7/1995 | 2003/Mar/23) — X:411 Y:314 ──
  drawMixedLine(ctx, `${dobEc} |${dobGc}`, 411, 314, { size: FS_MAIN, color: CLR_VALUE });

  // ── Sex / Gender — X:411 Y:381 ──
  drawMixedLine(ctx, `${sexAm} |${sexEn}`, 411, 381, { size: FS_MAIN, weight: 'bold', color: CLR_VALUE });

  // ── Expiry date — X:411 Y:447 ──
  drawMixedLine(ctx, `${expEc} |${expGc}`, 411, 447, { size: FS_MAIN, color: CLR_VALUE });

  // ── FAN number — X:482 Y:505 ──
  const fanFmt = fan.replace(/(\d{4})(?=\d)/g, '$1 ');
  drawText(ctx, fanFmt, 482, 505, { size: FS_MAIN, weight: 'bold', color: CLR_PRIMARY, isMono: true });

  // ── FAN barcode — X:478 Y:529 ──
  const barcodeFile = path.join(ROOT, 'output', 'barcode_export.png');
  if (fs.existsSync(barcodeFile)) {
    const barBuf = await sharp(barcodeFile)
      .resize(185, 36, { fit: 'fill' })
      .png()
      .toBuffer();
    const barImg = await loadImage(barBuf);
    ctx.drawImage(barImg, 478, 529, 185, 36);
  }

  // ── Issue date EC (vertical, left edge) — X:15 Y:409, font 4.7pt ──
  ctx.save();
  ctx.translate(15, 409);
  ctx.rotate(-Math.PI / 2);
  drawText(ctx, issEc, 0, 0, { size: FS_ISSUE, color: CLR_VALUE });
  ctx.restore();

  // ── Issue date GC (vertical, left edge) — X:15 Y:108, font 4.7pt ──
  ctx.save();
  ctx.translate(15, 108);
  ctx.rotate(-Math.PI / 2);
  drawText(ctx, issGc, 0, 0, { size: FS_ISSUE, color: CLR_VALUE });
  ctx.restore();

  // ── Second (thumbnail) photo — X:821 Y:457 W:84 H:123 ──
  if (fs.existsSync(portraitFile)) {
    const w = 84, h = 123;
    const thumbBuf = await sharp(portraitFile)
      .resize(w, h, { fit: 'cover', position: 'top' })
      .grayscale()
      .png()
      .toBuffer();
    const thumbImg = await loadImage(thumbBuf);
    ctx.drawImage(thumbImg, 821, 457, w, h);
  }

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buf);
  console.log(`[Export] Front saved: ${outputPath}`);
}

// ─── BACK ─────────────────────────────────────────────────────────────────────

async function renderBack(data, backImgPath, outputPath) {
  console.log('[Export] Rendering back...');

  const c  = data.contact     || {};
  const p  = data.personal    || {};
  const id = data.identifiers || {};

  const phone  = (c.phone    || {}).value || '';
  const natAm  = (p.nationality || {}).am || '\u12A2\u1275\u12EE\u1335\u12EB\u12CA';
  const natEn  = (p.nationality || {}).en || 'Ethiopian';
  const addrAm = (c.address  || {}).am   || '';
  const addrEn = (c.address  || {}).en   || '';
  const fin    = id.fin || '';

  const amParts   = addrAm.split(',').map(s => s.trim());
  const enParts   = addrEn.split(',').map(s => s.trim());
  const regAm     = amParts[0] || '';
  const zoneAm    = amParts[1] || '';
  const woredaAm  = amParts[2] || '';
  const regEn     = enParts[0] || '';
  const zoneEn    = enParts[1] || '';
  const woredaEn  = enParts[2] || '';

  const baseImg = await loadImage(backImgPath);

  // Fixed canvas: 1011 x 638
  const canvas  = createCanvas(CANVAS_W, CANVAS_H);
  const ctx     = canvas.getContext('2d');

  // Scale background to fill canvas exactly
  ctx.drawImage(baseImg, 0, 0, CANVAS_W, CANVAS_H);

  // ── Phone — X:23 Y:54, font 6.5pt ──
  drawText(ctx, phone, 23, 54, { size: FS_MAIN, weight: 'bold', color: CLR_VALUE, isMono: true });

  // ── Nationality — X:23 Y:155, font 7.3pt ──
  drawMixedLine(ctx, `${natAm} |${natEn}`, 23, 155, { size: FS_NAT, weight: 'bold', color: CLR_VALUE });

  // ── Region Amharic — X:23 Y:231, font 6.4pt ──
  drawText(ctx, regAm, 23, 231, { size: FS_ADDR_AM, color: CLR_VALUE, isEthiopic: true });
  // ── Region English — X:23 Y:239, font 7.1pt ──
  drawText(ctx, regEn, 23, 239, { size: FS_ADDR_EN, weight: 'bold', color: CLR_VALUE });

  // ── Zone/Subcity Amharic — X:23 Y:314, font 6.4pt ──
  drawText(ctx, zoneAm, 23, 314, { size: FS_ADDR_AM, color: CLR_VALUE, isEthiopic: true });
  // ── Zone/Subcity English — X:23 Y:351, font 7.1pt ──
  drawText(ctx, zoneEn, 23, 351, { size: FS_ADDR_EN, weight: 'bold', color: CLR_VALUE });

  // ── Woreda Amharic — X:23 Y:395, font 6.4pt ──
  drawText(ctx, woredaAm, 23, 395, { size: FS_ADDR_AM, color: CLR_VALUE, isEthiopic: true });
  // ── Woreda English — X:23 Y:433, font 7.1pt ──
  drawText(ctx, woredaEn, 23, 433, { size: FS_ADDR_EN, weight: 'bold', color: CLR_VALUE });

  // ── FIN — X:156 Y:239, font 5.5pt ──
  drawText(ctx, fin, 156, 239, { size: FS_FIN, weight: 'bold', color: CLR_PRIMARY, isMono: true });

  // ── QR code — X:461 Y:13 W:509 H:553 ──
  const qrFile = path.join(ROOT, 'output', 'qr_export.png');
  if (fs.existsSync(qrFile)) {
    const qw = 509, qh = 553;
    const qrBuf  = await sharp(qrFile)
      .resize(qw, qh, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();
    const qrImg  = await loadImage(qrBuf);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(461 - 3, 13 - 3, qw + 6, qh + 6);
    ctx.drawImage(qrImg, 461, 13, qw, qh);
  }

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buf);
  console.log(`[Export] Back saved: ${outputPath}`);
}

// ─── Public API ───
export async function exportIDCards(pipelineResult, frontImgPath, backImgPath, outputDir) {
  const outDir   = outputDir || path.join(ROOT, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const frontOut = path.join(outDir, 'id-export-front.png');
  const backOut  = path.join(outDir, 'id-export-back.png');

  await renderFront(pipelineResult, frontImgPath, frontOut);
  await renderBack(pipelineResult,  backImgPath,  backOut);

  return { front: frontOut, back: backOut };
}

// ─── CLI ───
if (process.argv[1] && process.argv[1].endsWith('id-card-exporter.js')) {
  const jsonPath  = process.argv[2] || path.join(ROOT, 'verification_result.json');
  const frontImg  = path.join(ROOT, 'front_V5.0.png');
  const backImg   = path.join(ROOT, 'back_v5.0.png');

  if (!fs.existsSync(jsonPath)) { console.error('JSON not found:', jsonPath); process.exit(1); }
  if (!fs.existsSync(frontImg)) { console.error('Front image not found:', frontImg); process.exit(1); }
  if (!fs.existsSync(backImg))  { console.error('Back image not found:', backImg);  process.exit(1); }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  exportIDCards(data, frontImg, backImg)
    .then(out => {
      console.log('\nExport complete!');
      console.log('  Front:', out.front);
      console.log('  Back: ', out.back);
    })
    .catch(err => { console.error('Export failed:', err); process.exit(1); });
}

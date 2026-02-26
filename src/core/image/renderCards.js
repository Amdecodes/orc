/**
 * renderCards.js  — ID card canvas renderer (core module)
 *
 * Moved from: export_id_card.js (project root)
 * Now lives:  src/core/image/renderCards.js
 *
 * Canvas: 1011 × 638 (fixed)
 * Fonts:  Noto Serif Ethiopic  +  Roboto
 *
 * Exports:
 *   renderFront(data, bgPath, outPath)    — writes PNG to disk (used by api_server)
 *   renderBack(data, bgPath, outPath)     — writes PNG to disk
 *   renderFrontBuffer(data, bgPath)       — returns PNG Buffer (used by generateID)
 *   renderBackBuffer(data, bgPath)        — returns PNG Buffer
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp  from 'sharp';
import fs     from 'fs';
import path   from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Project root is 3 levels up: src/core/image → src/core → src → project root
const ROOT      = path.resolve(__dirname, '../../..');

// ─── Fonts ───────────────────────────────────────────────────────────────────
registerFont(path.join(ROOT, 'fonts', 'NotoSerifEthiopic-Bold.ttf'),
             { family: 'Noto Serif Ethiopic', weight: 'bold' });
registerFont(path.join(ROOT, 'fonts', 'Roboto-Medium.ttf'),
             { family: 'Roboto', weight: '500' });
registerFont(path.join(ROOT, 'fonts', 'Roboto-Medium.ttf'),
             { family: 'Roboto Mono', weight: '500' });

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 1011, H = 638;

const CLR = '#000000';
const CLR_PRIMARY = '#000000';

// font sizes: point × 3.2 → pixels
const FS_MAIN    = 8 * 3.2;  // 24.8
const FS_ISSUE   = 5.2 * 3.2;  // 12.8
const FS_NAT     = 7.3 * 3.2;  // 23.36
const FS_ADDR_AM = 6.4 * 3.2;  // 20.48
const FS_ADDR_EN = 7.1 * 3.2;  // 22.72
const FS_FIN     = 7.1 * 3.2;  // 22.72

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isEth(s) {
  return /[\u1200-\u137F\u2D80-\u2DDF\uAB00-\uAB2F]/u.test(String(s));
}

// Decode a base64 PNG string to a Buffer (returns null if empty)
function b64buf(b64) {
  if (!b64 || typeof b64 !== 'string') return null;
  return Buffer.from(b64, 'base64');
}

/**
 * autocropPortrait — face-detect + crop via Python, then full grayscale in sharp.
 *
 * Sharp grayscale pipeline (adaptive for dark/medium Ethiopian skin):
 *   1. Adaptive recomb() — custom R/G/B channel weights based on image brightness
 *   2. gamma()           — lift shadows proportionally to skin darkness
 *   3. normalise()       — percentile-based contrast stretch
 *   4. clahe()           — local contrast enhancement
 *   5. sharpen()         — edge sharpening
 *   6. linear()          — final darkness trim
 */
async function autocropPortrait(b64, w, h, facePercent = 60) {

  // ── Step 1: face-detect + crop via Python ──────────────────────────────
  let croppedBuf;
  const pyScript = path.join(ROOT, 'src', 'utils', 'autocrop_face.py'); // always relative to project root
  const py = spawnSync(
    'python3', [pyScript, String(w), String(h), String(facePercent)],
    { input: b64, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  if (py.status === 0 && py.stdout.trim()) {
    croppedBuf = Buffer.from(py.stdout.trim(), 'base64');
  } else {
    if (py.stderr) console.warn('[autocrop fallback]', py.stderr.slice(0, 200));
    croppedBuf = await sharp(b64buf(b64))
      .trim().resize(w, h, { fit: 'cover', position: 'top' }).png().toBuffer();
  }

  // ── Step 2: measure image brightness to pick adaptive params ───────────
  const { channels } = await sharp(croppedBuf).stats();
  const meanR = channels[0]?.mean ?? 100;

  // t = 0 → very dark skin, t = 1 → lighter skin
  const t = Math.min(1, Math.max(0, (meanR - 40) / 100));

  // Adaptive channel weights (Red-heavy for dark, balanced for lighter)
  const wR = 0.65 - 0.20 * t;
  const wG = 0.30 + 0.18 * t;
  const wB = 0.05 + 0.02 * t;

  // Adaptive brightness lift (replaces gamma — sharp .gamma() only accepts 1.0–3.0)
  // dark skin (t=0) → 1.45× lift;  lighter skin (t=1) → 1.10× lift
  const brightness = 1.45 - 0.35 * t;

  // ── Step 3: full sharp grayscale pipeline ──────────────────────────────
  const result = await sharp(croppedBuf)
    // Custom B&W channel mix (Red-heavy for dark, balanced for lighter)
    .recomb([
      [wR, wG, wB],
      [wR, wG, wB],
      [wR, wG, wB],
    ])
    .modulate({ brightness })              // adaptive shadow lift
    .normalise({ lower: 2, upper: 98 })   // percentile contrast stretch
    .clahe({ width: 64, height: 64, maxSlope: 2 })   // local contrast
    .sharpen({ sigma: 1.2, m1: 0.5, m2: 0.5 })       // edge sharpening
    .linear(0.74, 0)                      // final darkness trim (×0.74)
    .png()
    .toBuffer();

  return result;
}



function txt(ctx, text, x, y, { size = 14, weight = 'normal', color = CLR,
  align = 'left', ethiopic = false, mono = false } = {}) {
  if (!text || String(text).trim() === '') return;
  const fam = ethiopic ? 'Noto Serif Ethiopic' : mono ? 'Roboto Mono' : 'Roboto';
  const w   = weight === 'bold' ? 'bold' : ethiopic ? 'bold' : weight; 
  ctx.font      = `${w} ${size}px "${fam}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(String(text), x, y);
}

function mixedLine(ctx, text, x, y, opts = {}) {
  if (!text || String(text).trim() === '') return;
  const parts = String(text).split('|');
  let cur = x;
  parts.forEach((part, i) => {
    const t   = part.trim();
    const fam = isEth(t) ? 'Noto Serif Ethiopic' : 'Roboto';
    const w   = opts.weight || (isEth(t) ? 'bold' : 'normal');
    ctx.font      = `${w} ${opts.size || 14}px "${fam}"`;
    ctx.fillStyle = opts.color || CLR;
    ctx.textAlign = 'left';
    ctx.fillText(t, cur, y);
    cur += ctx.measureText(t).width;
    if (i < parts.length - 1) {
      ctx.font = `${opts.weight || 'normal'} ${opts.size || 14}px "Roboto"`;
      ctx.fillText(' | ', cur, y);
      cur += ctx.measureText(' | ').width;
    }
  });
}

// ─── FRONT (shared render logic) ─────────────────────────────────────────────
async function _buildFrontCanvas(data, bgPath) {
  const p  = data.personal    || {};
  const v  = data.validity    || {};
  const id = data.identifiers || {};

  const namAm = (p.name   || {}).am || '';
  const namEn = (p.name   || {}).en || '';
  const dobEc = (p.dob    || {}).ec || '';
  const dobGc = (p.dob    || {}).gc || '';
  const sexAm = (p.gender || {}).am || '';
  const sexEn = (p.gender || {}).en || '';
  const expEc = (v.expiry || {}).ec || '';
  const expGc = (v.expiry || {}).gc || '';
  const issEc = (v.issue  || {}).ec || '';
  const issGc = (v.issue  || {}).gc || '';
  const fan   = id.fan || '';

  const bg     = await loadImage(bgPath);
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.drawImage(bg, 0, 0, W, H);

  // Portrait — X:89 Y:151 W:273 H:405
  const portraitB64 = (data.media?.portrait?.png) || null;
  if (portraitB64) {
    const buf = await autocropPortrait(portraitB64, 273, 405, 60);
    ctx.drawImage(await loadImage(buf), 89, 151, 273, 405);
  }

  // Amharic name — X:412 Y:201
  txt(ctx, namAm, 412, 201, { size: FS_MAIN, weight: 'bold', ethiopic: true });
  // English name — X:412 Y:235
  txt(ctx, namEn, 412, 235, { size: FS_MAIN, weight: 'bold' });
  // DOB — X:412 Y:335
  mixedLine(ctx, `${dobEc} |${dobGc}`, 412, 335, { size: FS_MAIN, weight: 'bold'});
  // Sex — X:412 Y:401
  mixedLine(ctx, `${sexAm} |${sexEn}`, 412, 401, { size: FS_MAIN, weight: 'bold'});
  // Expiry — X:412 Y:468
  mixedLine(ctx, `${expEc} |${expGc}`, 412, 468, { size: FS_MAIN, weight: 'bold'});

  // FAN number — X:482 Y:526
  const fanFmt = fan.replace(/(\d{4})(?=\d)/g, '$1 ');
  txt(ctx, fanFmt, 482, 526, { size: FS_MAIN, weight: 'bold', color: CLR_PRIMARY, mono: true });

  // FAN barcode — X:478 Y:530
  const barcodeB64 = (data.media?.barcode?.png) || null;
  if (barcodeB64) {
    const buf = await sharp(b64buf(barcodeB64)).resize(280, 55, { fit: 'fill' }).png().toBuffer();
    ctx.drawImage(await loadImage(buf), 478, 530, 280, 55);
  }

  // Issue date EC (rotated vertical)
  ctx.save(); ctx.translate(26, 462); ctx.rotate(-Math.PI / 2);
  txt(ctx, issEc, 0, 0, { size: FS_ISSUE, weight: 'bold'});
  ctx.restore();
  // Issue date GC (rotated vertical)
  ctx.save(); ctx.translate(26, 225); ctx.rotate(-Math.PI / 2);
  txt(ctx, issGc, 0, 0, { size: FS_ISSUE, weight: 'bold'});
  ctx.restore();

  // Thumbnail photo — X:821 Y:457 W:84 H:123
  if (portraitB64) {
    const buf = await autocropPortrait(portraitB64, 84, 123, 60);
    ctx.drawImage(await loadImage(buf), 821, 457, 84, 123);
  }

  return canvas;
}

/** File-writing variant (used by api_server.js and CLI) */
export async function renderFront(data, bgPath, outPath) {
  console.log('[Front] rendering…', { hasData: !!data, personal: !!data?.personal });
  const canvas = await _buildFrontCanvas(data, bgPath);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log('[Front] ✅', outPath);
}

/** Buffer-returning variant (used by generateID — no file I/O) */
export async function renderFrontBuffer(data, bgPath) {
  const canvas = await _buildFrontCanvas(data, bgPath);
  return canvas.toBuffer('image/png');
}

// ─── BACK (shared render logic) ──────────────────────────────────────────────
async function _buildBackCanvas(data, bgPath) {
  const c  = data.contact     || {};
  const p  = data.personal    || {};
  const id = data.identifiers || {};

  const phone  = (c.phone       || {}).value || '';
  const natAm  = (p.nationality || {}).am    || 'ኢትዮጵያዊ';
  const natEn  = (p.nationality || {}).en    || 'Ethiopian';
  const addrAm = (c.address || {}).am || '';
  const addrEn = (c.address || {}).en || '';
  const fin    = id.fin || '';

  const amP = addrAm.split(',').map(s => s.trim());
  const enP = addrEn.split(',').map(s => s.trim());

  const bg     = await loadImage(bgPath);
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.drawImage(bg, 0, 0, W, H);

  txt(ctx, phone, 22, 78, { size: FS_MAIN, weight: 'bold', mono: true });
  mixedLine(ctx, `${natAm} |${natEn}`, 22, 177, { size: FS_NAT, weight: 'bold' });

  txt(ctx, amP[0] || '', 22, 253, { size: FS_ADDR_AM, ethiopic: true });
  txt(ctx, enP[0] || '', 22, 290, { size: FS_ADDR_EN, weight: 'bold' });
  txt(ctx, amP[1] || '', 22, 335, { size: FS_ADDR_AM, ethiopic: true });
  txt(ctx, enP[1] || '', 22, 372, { size: FS_ADDR_EN, weight: 'bold' });
  txt(ctx, amP[2] || '', 22, 416, { size: FS_ADDR_AM, ethiopic: true });
  txt(ctx, enP[2] || '', 22, 454, { size: FS_ADDR_EN, weight: 'bold' });

  txt(ctx, fin, 156, 560, { size: FS_FIN, weight: 'bold', color: CLR_PRIMARY, mono: true });

  const qrB64 = (data.media?.qr?.png) || null;
  if (qrB64) {
    const pad = 12;
    const qw = 509, qh = 553;
    const buf = await sharp(b64buf(qrB64))
      .trim({ background: '#ffffff', threshold: 80 })
      .resize(qw - pad * 2, qh - pad * 2, { fit: 'fill' })
      .png().toBuffer();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(461, 13, qw, qh);
    ctx.drawImage(await loadImage(buf), 461 + pad, 13 + pad, qw - pad * 2, qh - pad * 2);
  } else {
    console.warn('[Back]  ⚠️  No QR image in pipeline result (media.qr.png is empty)');
  }

  return canvas;
}

/** File-writing variant (used by api_server.js and CLI) */
export async function renderBack(data, bgPath, outPath) {
  console.log('[Back] rendering…');
  const canvas = await _buildBackCanvas(data, bgPath);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log('[Back]  ✅', outPath);
}

/** Buffer-returning variant (used by generateID — no file I/O) */
export async function renderBackBuffer(data, bgPath) {
  const canvas = await _buildBackCanvas(data, bgPath);
  return canvas.toBuffer('image/png');
}

// ─── CLI (kept for direct invocation: node src/core/image/renderCards.js) ────
if (import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))) {
  (async () => {
    const jsonPath = process.argv[2] || path.join(ROOT, 'verification_result.json');
    const frontBg  = path.join(ROOT, 'front v3.0.png');
    const backBg   = path.join(ROOT, 'back V3.0.png');
    const outDir   = path.join(ROOT, 'output');

    if (!fs.existsSync(jsonPath)) { console.error('❌ JSON not found:', jsonPath); process.exit(1); }
    if (!fs.existsSync(frontBg))  { console.error('❌ front v3.0.png not found');  process.exit(1); }
    if (!fs.existsSync(backBg))   { console.error('❌ back V3.0.png not found');   process.exit(1); }

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    await renderFront(data, frontBg, path.join(outDir, 'id-export-front.png'));
    await renderBack (data, backBg,  path.join(outDir, 'id-export-back.png'));

    console.log('\n✅ Done!');
    console.log('   output/id-export-front.png');
    console.log('   output/id-export-back.png');
  })();
}

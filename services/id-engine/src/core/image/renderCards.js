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
const ROOT      = path.resolve(__dirname, '../../../../..');

// ─── Fonts ───────────────────────────────────────────────────────────────────
registerFont(path.join(ROOT, 'fonts', 'PGUNICODE1.TTF'),
             { family: 'PGUNICODE', weight: 'bold' });
registerFont(path.join(ROOT, 'fonts', 'Roboto-Medium.ttf'),
             { family: 'Roboto', weight: '500' });
registerFont(path.join(ROOT, 'fonts', 'Roboto-Medium.ttf'),
             { family: 'Roboto Mono', weight: '500' });

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 2652, H = 1670;

const CLR = '#000000';
const CLR_PRIMARY = '#000000';

// font sizes: point × (700 / 72) → pixels
const PT_TO_PX = 700 / 72;
const FS_MAIN    = 6.5 * PT_TO_PX;
const FS_ISSUE   = 4.0 * PT_TO_PX;
const FS_NAT     = 7.3 * PT_TO_PX;
const FS_ADDR_AM = 6.4 * PT_TO_PX;
const FS_ADDR_EN = 7.1 * PT_TO_PX;
const FS_FIN     = 5.5 * PT_TO_PX;

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
  const pyScript = path.join(__dirname, '../../utils/autocrop_face.py');
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
  const fam = ethiopic ? 'PGUNICODE' : mono ? 'Roboto Mono' : 'Roboto';
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
    const fam = isEth(t) ? 'PGUNICODE' : 'Roboto';
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

  // Portrait — X:256 Y:432 W:730 H:1081
  const portraitB64 = (data.media?.portrait?.png) || null;
  if (portraitB64) {
    const buf = await autocropPortrait(portraitB64, 730, 1081, 60);
    ctx.drawImage(await loadImage(buf), 256, 412, 730, 1081);
  }

  // Amharic name — X:1060 Y:479
  txt(ctx, namAm, 1060, 494, { size: FS_MAIN, weight: 'bold', ethiopic: true });
  // English name — X:1060 Y:568
  txt(ctx, namEn, 1060, 583, { size: FS_MAIN, weight: 'bold' });
  // DOB — X:1060 Y:828
  mixedLine(ctx, `${dobEc} |${dobGc}`, 1060, 843, { size: FS_MAIN, weight: 'bold'});
  // Sex — X:1060 Y:1010
  mixedLine(ctx, `${sexAm} |${sexEn}`, 1060, 1025, { size: FS_MAIN, weight: 'bold'});
  // Expiry — X:1060 Y:1191
  mixedLine(ctx, `${expEc} |${expGc}`, 1060, 1206, { size: FS_MAIN, weight: 'bold'});

  // FAN number — X:1209 Y:1326
  const fanFmt = fan.replace(/(\d{4})(?=\d)/g, '$1 ');
  txt(ctx, fanFmt, 1215, 1355, { size: FS_MAIN, weight: 'bold', color: CLR_PRIMARY, mono: true });

  // FAN barcode — X:1195 Y:1389
  const barcodeB64 = (data.media?.barcode?.png) || null;
  if (barcodeB64) {
    const bw = 730, bh = 145;
    const buf = await sharp(b64buf(barcodeB64)).resize(bw, bh, { fit: 'fill' }).png().toBuffer();
    ctx.drawImage(await loadImage(buf), 1200, 1385, bw, bh);
  }

  // Issue date EC (rotated vertical)
  ctx.save(); ctx.translate(90, 1250); ctx.rotate(-Math.PI / 2);
  txt(ctx, issEc, 0, 0, { size: FS_ISSUE, weight: 'bold'});
  ctx.restore();
  // Issue date GC (rotated vertical)
  ctx.save(); ctx.translate(90, 650); ctx.rotate(-Math.PI / 2);
  txt(ctx, issGc, 0, 0, { size: FS_ISSUE, weight: 'bold'});
  ctx.restore();

  // Thumbnail photo — X:2209 Y:1247 W:226 H:330
  if (portraitB64) {
    const buf = await autocropPortrait(portraitB64, 226, 330, 60);
    ctx.drawImage(await loadImage(buf), 2209, 1230, 226, 330);
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
  return canvas.toBuffer('image/jpeg', { quality: 0.95 });
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

  txt(ctx, phone, 85, 255, { size: FS_MAIN, weight: 'bold', mono: true });
  mixedLine(ctx, `${natAm} |${natEn}`, 85, 500, { size: FS_NAT, weight: 'bold' });

  txt(ctx, amP[0] || '', 85, 677, { size: FS_ADDR_AM, ethiopic: true });
  txt(ctx, enP[0] || '', 85, 770, { size: FS_ADDR_EN, weight: 'bold' });
  txt(ctx, amP[1] || '', 85, 914, { size: FS_ADDR_AM, ethiopic: true });
  txt(ctx, enP[1] || '', 85, 976, { size: FS_ADDR_EN, weight: 'bold' });
  txt(ctx, amP[2] || '', 85, 1089, { size: FS_ADDR_AM, ethiopic: true });
  txt(ctx, enP[2] || '', 85, 1186, { size: FS_ADDR_EN, weight: 'bold' });

  txt(ctx, fin, 427, 1465, { size: FS_FIN, weight: 'bold', color: CLR_PRIMARY, mono: true });

  const qrB64 = (data.media?.qr?.png) || null;
  if (qrB64) {
    const pad = 24;
    const qw = 1293, qh = 1400;
    const qx = 1198, qy = 92;
    const buf = await sharp(b64buf(qrB64))
      .trim({ background: '#ffffff', threshold: 80 })
      .resize(qw - pad * 2, qh - pad * 2, { fit: 'fill' })
      .png().toBuffer();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qx, qy, qw, qh);
    ctx.drawImage(await loadImage(buf), qx + pad, qy + pad, qw - pad * 2, qh - pad * 2);
  } else {
    console.warn('[Back]  ⚠️  No QR image in pipeline result (media.qr.png is empty)');
  }

  // 8-digit Serial Number — X:2185 Y:1548
  const serialNo = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  txt(ctx, serialNo, 2190, 1595, { size: FS_MAIN, weight: 'bold', mono: true });

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
  return canvas.toBuffer('image/jpeg', { quality: 0.95 });
}

// ─── CLI (kept for direct invocation: node src/core/image/renderCards.js) ────
if (import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))) {
  (async () => {
    const jsonPath = process.argv[2] || path.join(ROOT, 'verification_result.json');
    const frontBg  = path.join(ROOT, 'front_V5.0.png');
    const backBg   = path.join(ROOT, 'back_v5.0.png');
    const outDir   = path.join(ROOT, 'output');

    if (!fs.existsSync(jsonPath)) { console.error('❌ JSON not found:', jsonPath); process.exit(1); }
    if (!fs.existsSync(frontBg))  { console.error('❌ front_V5.0.png not found');  process.exit(1); }
    if (!fs.existsSync(backBg))   { console.error('❌ back_v5.0.png not found');   process.exit(1); }

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    await renderFront(data, frontBg, path.join(outDir, 'id-export-front.png'));
    await renderBack (data, backBg,  path.join(outDir, 'id-export-back.png'));

    console.log('\n✅ Done!');
    console.log('   output/id-export-front.png');
    console.log('   output/id-export-back.png');
  })();
}

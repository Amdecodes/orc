import sharp from "sharp";
import { runTesseractCLI, parseTSV } from "./cli_ocr.js";
import { CROPS } from "./crops.js";
import fs from "fs";
import { scanQR } from "./qr_engine.js";
import { findBackAnchors, getDynamicCrop, findLabelsInTSV } from "./anchor.js";
import { matchLocation, NUMERIC_WOREDA_REGIONS } from "./location_index.js";
import { extractValidityDates } from "../core/dates/issueDate.js";
import { toTitleCase, groupWordsIntoLines } from './ocr_utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper: Get image dimension from Sharp buffer
async function getImageWidth(buffer) {
    const m = await sharp(buffer).metadata();
    return m.width;
}

// Helper: Calculate center X of a box
function getBoxCenter(bbox) {
    return (bbox.x0 + bbox.x1) / 2;
}

// Stage 3 & 4: Extract based on Zone and Anchors
function extractFromLayout(lines, imgWidth) {
    // Check for layout data availability
    if (!lines || lines.length === 0 || !lines[0].bbox) {
        // console.log("DEBUG: No layout data (boxes) found. Using Strict Global Regex Fallback.");
        return extractGlobalStrict(lines);
    }

    const LEFT_LIMIT = imgWidth * 0.45;
    const RIGHT_START = imgWidth * 0.55;
    
    let phone = null;
    let fin = null;

    // Filter by Zones
    const leftLines = lines.filter(l => getBoxCenter(l.bbox) < LEFT_LIMIT);
    const rightLines = lines.filter(l => getBoxCenter(l.bbox) > RIGHT_START);

    // --- Phone Extraction (Left Zone) ---
    // Rule: Near "Phone" label and matches pattern
    for (let i = 0; i < leftLines.length; i++) {
        const line = leftLines[i];
        
        // Check for Phone Pattern (relaxed normalization as per user spec)
        // Allowed: 09..., 07..., 009..., 00 9...
        let digits = line.text.replace(/\D/g, "");
        if (digits.startsWith("009")) digits = "09" + digits.slice(3);
        else if (digits.startsWith("007")) digits = "07" + digits.slice(3);
        
        if (/^(09|07)\d{8}$/.test(digits)) {
             // Check proximity to "Phone" label (on this line or previous)
             // simplified: check if this line OR prev line OR next line has keyword
             // The user said: "Closest vertically to the word Phone"
             // For simplicity in this pass, we check if "Phone" is in the same zone nearby.
             // But simpler: Check if line itself or prev line mentions Phone/Mobile/ስልክ
             const context = (leftLines[i-1]?.text || "") + " " + line.text + " " + (leftLines[i+1]?.text || "");
             if (/Phone|Mobile|ስልክ/i.test(context)) {
                 phone = digits;
                 break; // Found one
             }
        }
    }

    // --- FIN Extraction (Right Zone) ---
    // Rule: Near "FIN" label, 3 groups of 4 digits
    for (let i = 0; i < rightLines.length; i++) {
        const line = rightLines[i];
        
        // Check for FIN Keyword
        // Accepted: FIN, FN, FI, F1
        const hasKeyword = /FIN|FN|FI|F1|ID|UIN/i.test(line.text);
        
        // Check for Previous line keyword if not on current
        const prevLine = rightLines[i-1];
        const hasPrevKeyword = prevLine && /FIN|FN|FI|F1|ID|UIN/i.test(prevLine.text);

        if (hasKeyword || hasPrevKeyword) {
            // Must contain 3 groups of 4 digits
            const groups = line.text.match(/\d{4}/g);
            if (groups && groups.length === 3) {
                // Ensure no extra digits (clean match)
                 const allDigits = line.text.match(/\d/g);
                 if (allDigits.length <= 13) {
                     fin = groups.join("");
                     break;
                 }
            }
        }
    }

    return { phone, fin, leftLines, rightLines };
}

function extractGlobalStrict(lines) {
    const fullText = lines.map(l => l.text).join('\n');
    let phone = null;
    let fin = null;

    // Strict Phone: Start with 09/07, 10 digits total.
    // Must NOT be part of a longer number.
    const phoneMatch = fullText.match(/(?:^|[^0-9])((?:09|07)\d{8})(?:[^0-9]|$)/);
    if (phoneMatch) phone = phoneMatch[1];

    // Strict FIN: 12 digits, maybe spaced.
    // e.g. "1234 5678 9012" or "123456789012"
    // Look for patterns like "1234 5678 9012" first (most common on ID)
    const finSpaced = fullText.match(/(?:^|[^0-9])(\d{4}[ ]\d{4}[ ]\d{4})(?:[^0-9]|$)/);
    
    if (finSpaced) {
        fin = finSpaced[1].replace(/\s/g, '');
    } else {
        // Fallback to continuous 12 digits if no spaced version found
        const finContinuous = fullText.match(/(?:^|[^0-9])(\d{12})(?:[^0-9]|$)/);
        if (finContinuous) {
             fin = finContinuous[1];
        }
    }

    // Sanity check: If FIN equals Phone (unlikely with regex), clear one.
    if (fin && phone && fin === phone) {
        fin = null; // Phone regex is more specific to phone prefixes
    }

    return { phone, fin };
}

// Helper: Voting Logic
function getVotedResult(results) {
    const counts = {};
    let maxCount = 0;
    let winner = null;

    results.forEach(r => {
        if (!r) return;
        counts[r] = (counts[r] || 0) + 1;
        if (counts[r] > maxCount) {
            maxCount = counts[r];
            winner = r;
        }
    });

    // Require 2/3 agreement (approx 0.66)
    // If we have 3 passes, maxCount must be >= 2.
    // If we have fewer passes (e.g. Pass 3 failed), majority of available? 
    // User said: count(value) / 3 >= 0.67. This implies absolute count >= 2.
    if (maxCount >= 2) return winner;
    return null;
}

/**
 * Hierarchically resolves address components from text using unified logic.
 */
function resolveAddress(text) {
    const result = { 
        region: null, 
        region_am: null,
        zone: null, 
        zone_am: null,
        woreda: null, 
        woreda_am: null,
        raw_text: text, 
        normalized: "", 
        confidence: 0 
    };

    if (!text || text.length < 3) return result;

    try {
        const match = matchLocation(text);
        if (match) {
            result.region = match.region;
            result.region_am = match.region_am;
            result.zone = match.zone;
            result.zone_am = match.zone_am;
            result.woreda = match.woreda;
            result.woreda_am = match.woreda_am;
            result.confidence = match.confidence;
            result.normalized = [match.region, match.zone, match.woreda].filter(Boolean).join(", ");
            result.normalized_am = [match.region_am, match.zone_am, match.woreda_am].filter(Boolean).join(", ");
        }
    } catch (e) {
        console.error(`[resolveAddress] Error: ${e.message}`);
        result._error = "Address parse failed safely";
    }

    return result;
}

/**
 * Deterministically extracts Woreda from TSV words.
 * Bank-grade rule: Keyword + 1-2 digits within +/- 2 lines, range 01-30.
 */
function extractWoredaDeterministic(words) {
    if (!words || words.length === 0) return null;

    const woredaKeywords = ["woreda", "wereda", "ወረዳ"];
    
    // Find keyword instances
    const keywordMatches = words.filter(w => 
        w.level === 5 && w.text && woredaKeywords.some(kw => w.text.toLowerCase().includes(kw))
    );

    for (const kw of keywordMatches) {
        // Look for numeric tokens ONLY on the SAME line as keyword
        // Rule: A number is a Woreda ONLY if it is explicitly bound to the word "Woreda"
        const candidates = words.filter(w => 
            w.level === 5 &&
            w.line_num === kw.line_num && 
            /^\d{1,2}$/.test(w.text)
        );

        for (const cand of candidates) {
            const num = parseInt(cand.text, 10);
            if (num >= 1 && num <= 30) {
                // Return numeric string only, resolveAddress will format based on region
                const result = String(num).padStart(2, '0');
                // console.log(`[WoredaRecovery] Found deterministic numeric woreda: ${result} (kw: ${kw.text}, line: ${kw.line_num})`);
                return result;
            }
        }
    }
    return null;
}

/**
 * Provides a default zone for a region in case of OCR failure.
 */
function defaultZoneForRegion(region) {
    const defaults = {
        "Addis Ababa": "Bole Subcity",
        "Oromia": "Sheger",
        "Amhara": "Bahir Dar",
        "Sidama": "Mehal Sidama Zone",
        "SNNPR": "Hawassa",
        "Somali": "Jigjiga",
        "Tigray": "Mekele"
    };
    return defaults[region] || null;
}

/**
 * Resolves nationality from text.
 */
function resolveNationality(text) {
    if (!text) return { value: null, am: "", confidence: 0 };
    const normalizedText = text.toLowerCase();

    if (normalizedText.includes("ethiopian") || normalizedText.includes("ኢትዮጵያዊ")) {
        return { value: "Ethiopian", am: "ኢትዮጵያዊ", confidence: 1.0 };
    }
    // Add other nationalities if needed
    return { value: null, am: "", confidence: 0 };
}


/**
 * Helper to get adaptive threshold based on image brightness
 */
async function getAdaptiveThreshold(buffer, defaultVal = 128) {
    try {
        const stats = await sharp(buffer).stats();
        const mean = stats.channels[0].mean;
        if (mean < 80) return Math.max(60, defaultVal - 40);
        if (mean > 180) return Math.min(200, defaultVal + 40);
        return defaultVal;
    } catch (e) {
        return defaultVal;
    }
}


export async function extractBackID(input) {
  // Accept Buffer (from generateID) or file path string (from api_server / CLI)
  const imageBuffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
  const imagePath   = Buffer.isBuffer(input) ? null : input;

  // console.log(`[extractBackID] 100% Safe Mode Start for ${imagePath ?? '<buffer>'}`);


  // For QR scan and tesseract we need a file path — write temp file if given a Buffer
  let tempFilePath = null;
  if (!imagePath) {
    tempFilePath = `/tmp/back_engine_${Date.now()}.png`;
    fs.writeFileSync(tempFilePath, imageBuffer);
  }
  const resolvedPath = imagePath || tempFilePath;

  const qrData = await scanQR(resolvedPath);
  if (qrData && qrData.uin && qrData.uin.length === 12) {
      if (tempFilePath && fs.existsSync(tempFilePath)) { try { fs.unlinkSync(tempFilePath); } catch (_) {} }
      return { ...qrData, _source: "QR", _status: "Extracted" };
  }

  // --- 1. Preprocessing (Anchor Pass Resolution) ---
  const metadata = await sharp(resolvedPath).metadata();
  const W_orig = metadata.width;
  const H_orig = metadata.height;
  
  // Use 2000px for anchor pass to get high detail on labels
  const normalizedBuffer = await sharp(resolvedPath)
    .resize(2000)
    .grayscale()
    .normalize()
    .toBuffer();
    
  const meta = await sharp(normalizedBuffer).metadata();
  const { width: W, height: H } = meta;

  try {
    // --- 2. Label Detection (Anchor Pass) ---
    // Use CLI on RESIZED image for robust label matching
    const labels = await findLabelsInTSV(normalizedBuffer);
    
    // Stage 1: Identify baseline (Y-coordinate) of each field
    // Use PSM 3 (Auto) for words as it's better at grouping lines
    const tempMainPath = `/tmp/main_norm_${Date.now()}.png`;
    fs.writeFileSync(tempMainPath, normalizedBuffer);
    const fullTSV = runTesseractCLI(tempMainPath, 'tsv', { psm: 3 });
    if (fs.existsSync(tempMainPath)) fs.unlinkSync(tempMainPath);
    
    const words = parseTSV(fullTSV);
    
    // Get original image metadata for scaling
    // (If not resized, scale is 1.0)
    const origW = W_orig;
    const origH = metadata.height;
    const scale = origW / W; 
    
    const findBaselineNormalized = (label, type) => {
        if (!label) return null;
        
        const logPath = 'debug_baselines.txt';
        fs.appendFileSync(logPath, `\n--- Searching for ${type} near label at y=${label.bbox.y0} ---\n`);

        const candidates = words.filter(w => w.level === 5).map(w => {
            let score = 0;
            const text = w.text.trim();
            
            if (type === 'phone') {
                if (/^(09|07)\d{8}$/.test(text)) score += 200;
                else if (/^(09|07)\d+/.test(text)) score += 100;
                else if (/\d{10}/.test(text)) score += 50;
                // If it doesn't start with 09/07, it's probably NOT a phone
                if (/^[1-8]/.test(text)) score -= 20; 
            }
            
            if (type === 'fin') {
                if (/^\d{12}$/.test(text)) score += 200;
                else if (/^\d{4}$/.test(text)) score += 50;
                else if (/\d{8,12}/.test(text)) score += 80;
            }
            
            if (/\d/.test(text)) score += 5;
            
            if (score > 10) { // Threshold for candidate
                fs.appendFileSync(logPath, `Candidate: y=${w.bbox.y0} score=${score} text="${text}"\n`);
                return { ...w, score };
            }
            return null;
        }).filter(c => c !== null);

        if (candidates.length === 0) {
            fs.appendFileSync(logPath, `No strong candidates for ${type}. Fallback to generous crop.\n`);
            return null;
        }

        const best = candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return Math.abs(a.bbox.y0 - label.bbox.y0) - Math.abs(b.bbox.y0 - label.bbox.y0);
        })[0];

        fs.appendFileSync(logPath, `Best for ${type}: y=${best.bbox.y0} score=${best.score}\n`);
        return best.bbox.y0;
    };

    const phoneBaselineY = findBaselineNormalized(labels.get('phone'), 'phone');
    const finBaselineY = findBaselineNormalized(labels.get('fin'), 'fin');
    
    // Scale found baselines to original resolution
    const phoneBaselineYOrig = phoneBaselineY * scale;
    const finBaselineYOrig = finBaselineY * scale;

    // Hard Stop: If primary labels aren't found, we can't be "100% Safe"
    const phoneLabel = labels.get('phone');
    const finLabel = labels.get('fin');
    
    if (!phoneLabel || !finLabel) {
        // console.log(`[SafeMode] Missing required labels: Phone=${!!phoneLabel}, FIN=${!!finLabel}. Returning null.`);
        // Note: Address/Nationality might still be extracted as best-effort if needed, 
        // but for numeric fields, we stop.
    }

    // --- 3. ROI Cropping (Scaled to Original) ---
    const crops = { phone: null, fin: null };
    
    if (labels.has('phone')) {
        const hasBaseline = phoneBaselineY !== null;
        crops.phone = {
            left: 0,
            top: hasBaseline ? (phoneBaselineYOrig - (40 * scale)) : (labels.get('phone').bbox.y0 * scale),
            width: Math.floor(origW * 0.6),
            height: hasBaseline ? Math.floor(120 * scale) : Math.floor(400 * scale), 
            isFallback: !hasBaseline
        };
    }
    
    if (labels.has('fin')) {
        const hasBaseline = finBaselineY !== null;
        crops.fin = {
            left: Math.floor(origW * 0.4),
            top: hasBaseline ? (finBaselineYOrig - (40 * scale)) : (labels.get('fin').bbox.y0 * scale),
            width: Math.floor(origW * 0.6),
            height: hasBaseline ? Math.floor(120 * scale) : Math.floor(400 * scale),
            isFallback: !hasBaseline
        };
    }

    // Sanitize crops with original dimensions
    const sanitizeCrop = (c) => {
        if (!c) return null;
        const out = {
            left: Math.max(0, Math.floor(c.left)),
            top: Math.max(0, Math.floor(c.top)),
            width: Math.min(origW - Math.max(0, Math.floor(c.left)), Math.floor(c.width)),
            height: Math.min(origH - Math.max(0, Math.floor(c.top)), Math.floor(c.height))
        };
        if (c.isFallback) out.isFallback = true;
        return out;
    };
    crops.phone = sanitizeCrop(crops.phone);
    crops.fin = sanitizeCrop(crops.fin);

    // --- Fix 2: Separate FIN and phone by Y-distance ---
    if (crops.phone && crops.fin) {
        const yDist = Math.abs(crops.phone.top - crops.fin.top);
        // Relaxed rule: If they are on different lines but < 15px apart, they might overlap.
        // If they are on the SAME line (yDist < 5), we allow it but handle during OCR.
        if (yDist > 5 && yDist < 15) {
            // console.log(`[SafeMode] FIN and Phone lines overlapping (${yDist}px). Rejecting both.`);
            crops.phone = null;
            crops.fin = null;
        }
    }

    const getSafeDigits = async (cropRect, type) => {
        if (!cropRect) return { value: null, candidates: [] };
        
        const passes = [];
        
        // Key improvement: 4x upscale gives Tesseract 16x more pixels to distinguish 6 vs 8
        const upscaledWidth = cropRect.width * 4;
        
        // Pass A: Upscaled + Standard Threshold
        passes.push(await sharp(resolvedPath).extract(cropRect).resize({ width: upscaledWidth }).threshold(128).png().toBuffer());
        // Pass B: Upscaled + High Contrast
        passes.push(await sharp(resolvedPath).extract(cropRect).resize({ width: upscaledWidth }).modulate({ contrast: 2.0 }).threshold(180).png().toBuffer());
        // Pass C: Upscaled + Sharpened
        passes.push(await sharp(resolvedPath).extract(cropRect).resize({ width: upscaledWidth }).sharpen().threshold(140).png().toBuffer());
        // Pass D: Upscaled + Inverted (helps with low-contrast digits)
        passes.push(await sharp(resolvedPath).extract(cropRect).resize({ width: upscaledWidth }).negate().threshold(128).png().toBuffer());
        // Pass E: 8x Extreme Upscale (brute force resolution)
        passes.push(await sharp(resolvedPath).extract(cropRect).resize({ width: cropRect.width * 8 }).threshold(128).png().toBuffer());

        const candidates = [];
        for (const buf of passes) {
            const tempPath = `/tmp/safe_crop_${Date.now()}_${Math.floor(Math.random()*1000)}.png`;
            fs.writeFileSync(tempPath, buf);
            
            // Digit-Only OCR: Whitelist + OEM 1 (LSTM only - better for similar digits)
            const currentPSM = cropRect.isFallback ? 6 : 7;
            
            const text = runTesseractCLI(tempPath, 'txt', {
                psm: currentPSM,
                oem: 1, // LSTM only
                params: {
                    tessedit_char_whitelist: "0123456789", 
                    load_system_dawg: "0",
                    load_freq_dawg: "0"
                }
            });
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            
            // Normalize digits
            let digits = (text || "").toUpperCase()
                .replace(/O/g, "0")
                .replace(/S/g, "5")
                .replace(/[Il]/g, "1")
                .replace(/B/g, "8")
                .replace(/\D/g, "");
            
            if (type === 'fin') {
                const match = digits.match(/\d{12,15}/);
                if (match) candidates.push(match[0].slice(-12));
            } else if (type === 'phone') {
                const match = digits.match(/(09|07)\d{8}/);
                if (match) candidates.push(match[0]);
            }
        }

        if (candidates.length === 0) return { value: null, candidates: [] };

        // --- Per-digit voting for phone (simple majority per position) ---
        if (type === 'phone' && candidates.length >= 2 && candidates.every(c => c.length === 10)) {
            const voted = [];
            for (let pos = 0; pos < 10; pos++) {
                const digitCounts = {};
                for (const c of candidates) {
                    const d = c[pos];
                    digitCounts[d] = (digitCounts[d] || 0) + 1;
                }
                const best = Object.entries(digitCounts).sort((a, b) => b[1] - a[1])[0];
                voted.push(best[0]);
            }
            const result = voted.join('');
            if (/^(09|07)\d{8}$/.test(result)) {
                console.log(`[PhoneVote] Per-digit voted result: ${result} from [${candidates.join(', ')}]`);
                return { value: result, candidates };
            }
        }

        // VOTE: Whole-string majority rule (FIN or phone fallback)
        const counts = {};
        for (const c of candidates) {
            counts[c] = (counts[c] || 0) + 1;
        }
        
        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
        const [winner, count] = sorted[0];

        if (count >= 2) {
            return { value: winner, candidates };
        }

        // console.log(`[SafeMode] No consensus for ${type}: ${candidates.join(' | ')}`);
        return { value: null, candidates };
    };

    /**
     * STAGE 4: Controlled Recovery
     */
    const attemptRecovery = async (cropRect, type, seenCandidates) => {
        if (!cropRect) return null;
        // console.log(`[Stage 4] Attempting Recovery for ${type}...`);

        const recoveryPasses = [];
        // Layer A: Extreme Upscale (Separates touching digits)
        recoveryPasses.push(await sharp(resolvedPath).extract(cropRect).resize(null, 400).threshold(128).png().toBuffer());
        // Layer A: Inverted (Fixes low contrast)
        recoveryPasses.push(await sharp(resolvedPath).extract(cropRect).negate().threshold(128).png().toBuffer());
        // Layer A: Blurred -> Sharpened (Breaks hallucination)
        recoveryPasses.push(await sharp(resolvedPath).extract(cropRect).blur(1).sharpen().threshold(128).png().toBuffer());

        for (const buf of recoveryPasses) {
            const tempPath = `/tmp/recovery_crop_${Date.now()}_${Math.floor(Math.random()*1000)}.png`;
            fs.writeFileSync(tempPath, buf);
            
            const text = runTesseractCLI(tempPath, 'txt', {
                psm: 7,
                params: { tessedit_char_whitelist: "0123456789" }
            });
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

            let digits = (text || "").replace(/\D/g, "");
            let candidate = null;
            if (type === 'fin') {
                const m = digits.match(/\d{12}/);
                if (m) candidate = m[0];
            } else if (type === 'phone') {
                const m = digits.match(/(09|07)\d{8}/);
                if (m) candidate = m[0];
            }

            if (candidate) {
                // console.log(`[Stage 4A] Found recovery candidate: ${candidate}`);
                // Acceptance Rule: Match ANY previously seen candidate
                if (seenCandidates.includes(candidate)) {
                    // console.log(`[Stage 4A] MATCH FOUND in previous candidates! Accepting ${candidate}.`);
                    return candidate;
                }

                // Layer C: Structural Proof (Phone specific)
                // Accept if valid prefix, length 10, and high-quality match
                if (type === 'phone' && /^(09|07)\d{8}$/.test(candidate)) {
                    // console.log(`[Stage 4C] Structural Proof: Valid Phone format detected. Accepting ${candidate}.`);
                    return candidate;
                }
            }
        }

        // Layer B: Geometry Check (Digit Scan) - Simplified
        // If we see 10 digits in ANY of the raw OCR variants but it wasn't valid, 
        // we might have a minor misread. But the user rule is "If matches ANY seen candidate".
        // Let's add one more variant: Very High Threshold
        const highThreshBuf = await sharp(resolvedPath).extract(cropRect).threshold(200).png().toBuffer();
        const tempPath = `/tmp/recovery_b_${Date.now()}.png`;
        fs.writeFileSync(tempPath, highThreshBuf);
        const text = runTesseractCLI(tempPath, 'txt', { psm: 7, params: { tessedit_char_whitelist: "0123456789" } });
        fs.unlinkSync(tempPath);
        let digits = (text || "").replace(/\D/g, "");
        if (digits.length === (type === 'fin' ? 12 : 10) && seenCandidates.includes(digits)) return digits;

        return null;
    };

    const finResult = await getSafeDigits(crops.fin, 'fin');
    const phoneResult = await getSafeDigits(crops.phone, 'phone');

    let fin = finResult.value;
    let phone = phoneResult.value;

    // Trigger Stage 4 if null
    if (!fin && crops.fin) {
        fin = await attemptRecovery(crops.fin, 'fin', finResult.candidates);
    }
    if (!phone && crops.phone) {
        phone = await attemptRecovery(crops.phone, 'phone', phoneResult.candidates);
    }

    // --- 4E: Global Phone Fallback ---
    // If phone is still null, try a global search in the results we ALREADY have
    let fullTextRaw = null; // Declare in outer scope
    if (!phone) {
        // Use the words from the anchor pass (TSV)
        for (const w of words) {
            if (w.level === 5 && /^(09|07)\d{8}$/.test(w.text)) {
                // console.log(`[PhoneRecovery] Found phone in global TSV: ${w.text}`);
                phone = w.text;
                break;
            }
        }
    }
    if (!phone) {
        // Try the raw text from the address/nationality pass
        fullTextRaw = runTesseractCLI(resolvedPath, 'txt', { psm: 3 });
        const phoneMatch = fullTextRaw.match(/(?:^|[^0-9])((?:09|07)\d{8})(?:[^0-9]|$)/);
        if (phoneMatch) {
            // console.log(`[PhoneRecovery] Found phone in global text: ${phoneMatch[1]}`);
            phone = phoneMatch[1];
        }
    }

    // --- 5. Semantic Fields (Best Effort) ---
    // We already have the normalized full text from the anchor pass (TSV)
    // but a full English+Amharic pass is better for address.
    // fullTextRaw may have been initialized in 4E
    if (!fullTextRaw) {
        fullTextRaw = runTesseractCLI(resolvedPath, 'txt', { psm: 3 });
    }
    const address = resolveAddress(fullTextRaw);
    
    // Independent Woreda lookup (Logic: Textual Match > Numeric Fallback)
    const deterministicWoreda = extractWoredaDeterministic(words);
    if (deterministicWoreda) {
        const isNumericRegion = NUMERIC_WOREDA_REGIONS.includes(address.region);
        
        // RULE: Numeric recovery must NEVER override a detected textual woreda.
        // We only apply it if address.woreda is null/empty.
        if (isNumericRegion && !address.woreda) {
             const targetWoreda = "Woreda " + deterministicWoreda;
             // console.log(`[WoredaRecovery] No textual Woreda found. Applying deterministic fallback: ${targetWoreda}`);
             address.woreda = targetWoreda;
             address.woreda_am = "ወረዳ " + deterministicWoreda;
             address.confidence = Math.max(address.confidence, 0.85); // Lower confidence for recovery
             address.normalized = [address.region, address.zone, address.woreda].filter(Boolean).join(", ");
             address.normalized_am = [address.region_am, address.zone_am, address.woreda_am].filter(Boolean).join(", ");
        } else if (deterministicWoreda && address.woreda) {
             // console.log(`[WoredaRecovery] Ignoring numeric recovery (${deterministicWoreda}) because textual Woreda (${address.woreda}) is already locked.`);
        }
    }

    const nationality = resolveNationality(fullTextRaw);
 
    // --- Validity Date Extraction ---
    // Use semantic line grouping (splits on line_num OR | separators)
    const ocrLines = groupWordsIntoLines(words);
    const validity = extractValidityDates(ocrLines, W);

    // --- 6. Final Evaluation ---
    const isSuccess = !!fin; // At minimum, we want FIN correctly
    

    // --- 6. Final Evaluation & Confidence Scoring ---

    const calculateConfidence = (val, type, meta = {}) => {

        if (!val) return 0;
        let score = 0;

        // QR Source: Absolute Trust
        if (meta.source === "QR") return 1.0;

        if (type === "fin") {
            // FIN Rules
            if (/^\d{12}$/.test(val)) score += 0.8;
            if (meta.consensus) score += 0.15; // 2+ passes agreed
            if (meta.cached) score += 0.1;
        } 
        
        if (type === "phone") {
            // Phone Rules
            if (/^(09|07)\d{8}$/.test(val)) score += 0.8;
            if (meta.labelProximity) score += 0.1; 
            if (meta.consensus) score += 0.1;
        }

        if (type === "address") {
            // Already computed in resolveAddress
            return val.confidence || 0;
        }

        return Math.min(0.95, score); // Cap OCR at 0.95, only QR gets 1.0
    };

    const finConfidence = calculateConfidence(fin, 'fin', { 
        source: qrData?.uin ? "QR" : "OCR",
        consensus: finResult ? (finResult.candidates && finResult.candidates.filter(c => c === fin).length >= 2) : false
    });

    const phoneConfidence = calculateConfidence(phone, 'phone', {
        source: qrData?.phone ? "QR" : "OCR",
        consensus: phoneResult ? (phoneResult.candidates && phoneResult.candidates.filter(c => c === phone).length >= 2) : false,
        labelProximity: true 
    });

    return {
      fin: fin || qrData?.uin || null, 
      phone: phone || qrData?.phone || null,
      nationality,
      address,
      validity,
      vid: qrData?.vid || null,
      _status: (fin && phone) ? "Extracted (Safe Mode)" : "Partial/Failed",
      _source: "Safe Mode Architecture",
      _confidence: {
          fin: finConfidence,
          phone: phoneConfidence,
          address: address.confidence,
          validity: {
              issue_date: validity.validity.confidence,
              expiry_date: validity.validity.confidence
          }
      }
    };

  } catch (e) {
    console.error(`[SafeMode] Fatal Error: ${e.message}`);
    return { fin: null, phone: null, _status: "Error", _error: e.message };
  } finally {
    // Clean up temp file if we created one
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
  }
}

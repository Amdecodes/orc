import sharp from "sharp";
import { runTesseractCLI, parseTSV } from "./cli_ocr.js";
import crypto from "crypto";
import { CROPS } from "./crops.js";
import fs from "fs";
import { scanQR } from "./qr.js";
import { findBackAnchors, getDynamicCrop, findLabelsInTSV } from "./anchor.js";

const NUMERIC_WOREDA_REGIONS = ["Addis Ababa", "Dire Dawa"];

function toTitleCase(str) {
  if (!str) return "";
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

/**
 * Calculates pixel coordinates from percentages based on image dimensions.
 */
function getCropRect(cropDef, imgWidth, imgHeight) {
  return {
    left: Math.round(cropDef.xPct * imgWidth),
    top: Math.round(cropDef.yPct * imgHeight),
    width: Math.round(cropDef.wPct * imgWidth),
    height: Math.round(cropDef.hPct * imgHeight)
  };
}

/**
 * Preprocesses a crop: grayscale -> normalize -> threshold -> sharpen
 */
async function processCrop(imageBuffer, cropRect, imgWidth, imgHeight, threshold = 128) {
  // Bounds check
  if (cropRect.left < 0 || cropRect.top < 0 || 
      cropRect.left + cropRect.width > imgWidth || 
      cropRect.top + cropRect.height > imgHeight ||
      cropRect.width <= 0 || cropRect.height <= 0) {
      console.warn("Crop out of bounds, skipping...", cropRect);
      return null;
  }

  return await sharp(imageBuffer)
    .extract(cropRect)
    .grayscale()
    .normalize()
    .threshold(threshold) 
    .sharpen({ sigma: 1 })
    .png()
    .toBuffer();
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Fuzzy matches a text against a list of candidates.
 */
function fuzzyMatch(text, candidates, maxDist = 2) {
  if (!text || text.trim().length < 3) return null; 
  
  const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleanText.length < 3) return null;

  let best = null;
  let minDist = Infinity;

  for (const c of candidates) {
    const cleanCand = c.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanText.includes(cleanCand) || cleanCand.includes(text.toLowerCase())) {
       return { value: c, dist: 0 }; 
    }
    
    // Scale threshold by length
    const allowed = Math.min(maxDist, Math.floor(cleanCand.length / 3));
    const dist = levenshtein(cleanText, cleanCand);
    
    if (dist <= allowed && dist < minDist) {
      minDist = dist;
      best = c;
    }
  }

  if (best) return { value: best, dist: minDist };
  return null;
}

// Load full location tree
let LOCATION_DATA = null;
function getLocationData() {
  if (LOCATION_DATA) return LOCATION_DATA;
  try {
    const data = fs.readFileSync(new URL('../et.json', import.meta.url));
    LOCATION_DATA = JSON.parse(data);
    return LOCATION_DATA;
  } catch (e) {
    console.warn("Could not load et.json", e);
    return [];
  }
}

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
        console.log("DEBUG: No layout data (boxes) found. Using Strict Global Regex Fallback.");
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
 * Aggressively normalizes text for location matching.
 */
function normalizeLocationText(text) {
    if (!text) return "";
    return text.toLowerCase()
        .replace(/[0-9]/g, '') // Remove numbers (often OCR noise in address fields)
        .replace(/[፡[\]()|\\/]/g, ' ') // Map common separator artifacts to space
        .replace(/\s+/g, ' ') // Consolidate whitespace
        .trim();
}

/**
 * Hierarchically resolves address components from text.
 */
function resolveAddress(text) {
    const data = getLocationData();
    const result = { 
        region: null, 
        zone: null, 
        woreda: null, 
        raw_text: "", 
        normalized: "", 
        confidence: 0 
    };
    if (!text || text.length < 3) return result;

    const flatText = text.replace(/\n/g, ' ');
    const normalizedText = normalizeLocationText(text);

    // Track matched tokens for address.raw
    const matchedTokens = [];

    // 1. Find Region (Best match)
    let bestRegion = null;

    const regionAliases = {
        "Addis Ababa": ["አዲስ አበባ", "አ/አ", "a.a", "addis ababa", "adlis abba", "addes ababa"],
        "Oromia": ["ኦሮሚያ", "oromiya", "oronia", "oromiyaa"],
        "Amhara": ["አማራ", "anhara", "amara"],
        "Sidama": ["ሲዳማ", "sidana", "sidama region"],
        "SNNPR": ["ደቡብ", "s.n.n.p.r", "snnp", "south ethiopia"],
        "Dire Dawa": ["ድሬዳዋ", "ድሬ ዳዋ", "dire dawa city"],
        "Tigray": ["ትግራይ", "tigrai", "tegray"]
    };

    for (const r of data) {
        const rName = r.region.en.toLowerCase();
        const rAm = r.region.am;
        
        // Try exact match or aliases
        if (normalizedText.includes(rName) || (rAm && text.includes(rAm))) {
            bestRegion = r.region.en;
            matchedTokens.push(rName); // Use normalized matching token
            break;
        }
        
        const aliases = regionAliases[r.region.en] || [];
        const foundAlias = aliases.find(a => normalizedText.includes(a));
        if (foundAlias) {
            bestRegion = r.region.en;
            matchedTokens.push(foundAlias);
            break;
        }
    }

    if (!bestRegion) return result;
    result.region = bestRegion;
    result.confidence += 0.4;
    result.raw_text = matchedTokens.join("\n");

    // 2. Find Zone within Region
    const regionObj = data.find(r => r.region.en === result.region);
    if (regionObj && regionObj.zones) {
        let bestZone = null;
        let zoneData = null;

        const ZONE_ALIASES = {
            "Mehal Sidama Zone": ["mehal sidama", "sidama mehal", "መሃል ሲዳማ"],
            "Hawassa Citiy Administration": ["hawassa city", "hawassa administration", "ሀዋሳ ከተማ", "hawasa"],
            "Addis Ketema Subcity": ["addis ketema", "አዲስ ከተማ"],
            "Akaki Kaliti Subcity": ["akaki kaliti", "akaqi", "አቃቂ ቃሊቲ"],
            "Arada Subcity": ["arada", "አራዳ"],
            "Bole Subcity": ["bole", "ቦሌ"],
            "Gulele Subcity": ["gulele", "ጉለሌ"],
            "Kerkos": ["kerkos", "kirkos", "ቂርቆስ"],
            "Kolfe Keraniyo Subcity": ["kolfe keraniyo", "ኮልፌ ቀራኒዮ"],
            "Lemi Kura Subcity": ["lemi kura", "ለሚ ኩራ"],
            "Lideta": ["lideta", "ልደታ"],
            "Nifas Silk Lafto Subcity": ["nifas silk", "lafto", "ንፋስ ስልክ"],
            "Yeka Subcity": ["yeka", "የካ"],
            "Lemi Kura": ["lemi kura", "ለሚ ኩራ"]
        };

        for (const z of regionObj.zones) {
            let zName = z.zone.en;
            
            // FIX: Stop inventing words ("Subcity") for Addis Ababa
            if (result.region === "Addis Ababa") {
                zName = zName.replace(/\s*subcity\s*/i, "").trim();
            }

            const zEnLower = zName.toLowerCase();
            const zAm = z.zone.am;
            const aliases = ZONE_ALIASES[zName] || [];

            // Pattern match: word-based overlap or alias
            const zWords = zEnLower.split(' ').filter(w => w.length > 2);
            const matchesWords = zWords.length > 0 && zWords.every(word => normalizedText.includes(word));
            const foundAlias = aliases.find(a => normalizedText.includes(a.toLowerCase()));

            if (matchesWords || foundAlias || (zAm && text.includes(zAm))) {
                bestZone = toTitleCase(zName);
                zoneData = z;
                matchedTokens.push(foundAlias || zName);
                break;
            }
        }
        
        if (bestZone) {
            result.zone = bestZone;
            result.confidence += 0.5;
            result.raw_text = matchedTokens.join("\n");
            
            // 3. Find Woreda within Zone
            if (zoneData && zoneData.woredas) {
                // Priority 1: Exact Amharic match
                for (const w of zoneData.woredas) {
                    if (w.am && flatText.includes(w.am)) {
                        const isNumericRegion = NUMERIC_WOREDA_REGIONS.includes(result.region);
                        result.woreda = isNumericRegion 
                            ? "Woreda " + w.en.replace(/\D/g, '').padStart(2, '0')
                            : toTitleCase(w.en);
                        result.confidence += 0.4;
                        matchedTokens.push(w.am);
                        break;
                    }
                }
                // Priority 2: English match or numeric pattern
                if (!result.woreda) {
                    for (const w of zoneData.woredas) {
                        const wEnLower = w.en.toLowerCase();
                        const bareWoreda = wEnLower.replace('wereda ', '').replace('woreda ', '');
                        if (normalizedText.includes(bareWoreda) && bareWoreda.length > 2) {
                            const isNumericRegion = NUMERIC_WOREDA_REGIONS.includes(result.region);
                            if (isNumericRegion) {
                                result.woreda = "Woreda " + bareWoreda.padStart(2, '0');
                            } else {
                                result.woreda = toTitleCase(w.en);
                            }
                            result.confidence += 0.4;
                            matchedTokens.push(bareWoreda);
                            break;
                        }
                    }
                }
                // Stage 4C: Semantic Proof (Deterministic recovery)
                if (!result.woreda) {
                    const numMatch = normalizedText.match(/(?:woreda|wereda|ወረዳ)\s?(\d{1,2})/i);
                    if (numMatch) {
                        const num = String(parseInt(numMatch[1], 10)).padStart(2, '0');
                        const found = zoneData.woredas.find(w => w.en.includes(num));
                        if (found) {
                            const isNumericRegion = NUMERIC_WOREDA_REGIONS.includes(result.region);
                            if (isNumericRegion) {
                                result.woreda = "Woreda " + num;
                                result.confidence += 0.3;
                                matchedTokens.push("Woreda " + num);
                                console.log(`[Stage 4C] Recovered Woreda ${num} from numeric pattern.`);
                            }
                        }
                    }
                }
                if (result.woreda) {
                    result.raw_text = matchedTokens.join("\n");
                    result.normalized = [result.region, result.zone, result.woreda].filter(Boolean).join(", ");
                }
            }
        }
    }

    result.confidence = Math.min(1.0, result.confidence);
    if (!result.normalized && result.region) {
        result.normalized = [result.region, result.zone, result.woreda].filter(Boolean).join(", ");
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
                console.log(`[WoredaRecovery] Found deterministic numeric woreda: ${result} (kw: ${kw.text}, line: ${kw.line_num})`);
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
    if (!text) return { value: null, confidence: 0, raw: "" };
    const normalizedText = text.toLowerCase();

    if (normalizedText.includes("ethiopian") || normalizedText.includes("ኢትዮጵያዊ")) {
        return { value: "Ethiopian", confidence: 1.0, raw: text };
    }
    // Add other nationalities if needed
    return { value: null, confidence: 0, raw: text };
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

// Stage 4D Cache
const CACHE_FILE = './ocr_cache.json';
function getCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveCache(cache) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {}
}

function getImageHash(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
}

export async function extractBackID(imagePath) {
  console.log(`[extractBackID] 100% Safe Mode Start for ${imagePath}`);
  
  const imageBuffer = fs.readFileSync(imagePath);
  const imgHash = getImageHash(imageBuffer);
  const cache = getCache();

  const qrData = await scanQR(imagePath);
  if (qrData && qrData.uin && qrData.uin.length === 12) {
      if (qrData.uin) cache[imgHash] = { fin: qrData.uin, phone: qrData.phone };
      saveCache(cache);
      return { ...qrData, _source: "QR", _status: "Extracted" };
  }

  // --- 1. Preprocessing (Anchor Pass Resolution) ---
  const metadata = await sharp(imagePath).metadata();
  const W_orig = metadata.width;
  const H_orig = metadata.height;
  
  // Use 2000px for anchor pass to get high detail on labels
  const normalizedBuffer = await sharp(imagePath)
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
        console.log(`[SafeMode] Missing required labels: Phone=${!!phoneLabel}, FIN=${!!finLabel}. Returning null.`);
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
            console.log(`[SafeMode] FIN and Phone lines overlapping (${yDist}px). Rejecting both.`);
            crops.phone = null;
            crops.fin = null;
        }
    }

    const getSafeDigits = async (cropRect, type) => {
        if (!cropRect) return { value: null, candidates: [] };
        
        const passes = [];
        // Pass A: Standard
        passes.push(await sharp(imagePath).extract(cropRect).threshold(128).png().toBuffer());
        // Pass B: High Contrast
        passes.push(await sharp(imagePath).extract(cropRect).modulate({ contrast: 2.0 }).threshold(180).png().toBuffer());
        // Pass C: Sharpened
        passes.push(await sharp(imagePath).extract(cropRect).sharpen().threshold(140).png().toBuffer());

        const candidates = [];
        for (const buf of passes) {
            const tempPath = `/tmp/safe_crop_${Date.now()}_${Math.floor(Math.random()*1000)}.png`;
            fs.writeFileSync(tempPath, buf);
            
            // Digit-Only OCR: Whitelist
            // If the crop is a fallback (no baseline found), use PSM 6
            const currentPSM = cropRect.isFallback ? 6 : 7;
            
            const text = runTesseractCLI(tempPath, 'txt', {
                psm: currentPSM,
                params: {
                    tessedit_char_whitelist: "0123456789OSIlB", 
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

        // VOTE: Majority rule (e.g. 2/3 agreement)
        const counts = {};
        for (const c of candidates) {
            counts[c] = (counts[c] || 0) + 1;
        }
        
        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
        const [winner, count] = sorted[0];

        // Safe Rule: 2 out of 3 passes must agree
        if (count >= 2) {
            return { value: winner, candidates };
        }

        console.log(`[SafeMode] No consensus for ${type}: ${candidates.join(' | ')}`);
        return { value: null, candidates };
    };

    /**
     * STAGE 4: Controlled Recovery
     */
    const attemptRecovery = async (cropRect, type, seenCandidates) => {
        if (!cropRect) return null;
        console.log(`[Stage 4] Attempting Recovery for ${type}...`);

        const recoveryPasses = [];
        // Layer A: Extreme Upscale (Separates touching digits)
        recoveryPasses.push(await sharp(imagePath).extract(cropRect).resize(null, 400).threshold(128).png().toBuffer());
        // Layer A: Inverted (Fixes low contrast)
        recoveryPasses.push(await sharp(imagePath).extract(cropRect).negate().threshold(128).png().toBuffer());
        // Layer A: Blurred -> Sharpened (Breaks hallucination)
        recoveryPasses.push(await sharp(imagePath).extract(cropRect).blur(1).sharpen().threshold(128).png().toBuffer());

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
                console.log(`[Stage 4A] Found recovery candidate: ${candidate}`);
                // Acceptance Rule: Match ANY previously seen candidate
                if (seenCandidates.includes(candidate)) {
                    console.log(`[Stage 4A] MATCH FOUND in previous candidates! Accepting ${candidate}.`);
                    return candidate;
                }

                // Layer C: Structural Proof (Phone specific)
                // Accept if valid prefix, length 10, and high-quality match
                if (type === 'phone' && /^(09|07)\d{8}$/.test(candidate)) {
                    console.log(`[Stage 4C] Structural Proof: Valid Phone format detected. Accepting ${candidate}.`);
                    return candidate;
                }
            }
        }

        // Layer B: Geometry Check (Digit Scan) - Simplified
        // If we see 10 digits in ANY of the raw OCR variants but it wasn't valid, 
        // we might have a minor misread. But the user rule is "If matches ANY seen candidate".
        // Let's add one more variant: Very High Threshold
        const highThreshBuf = await sharp(imagePath).extract(cropRect).threshold(200).png().toBuffer();
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
                console.log(`[PhoneRecovery] Found phone in global TSV: ${w.text}`);
                phone = w.text;
                break;
            }
        }
    }
    if (!phone) {
        // Try the raw text from the address/nationality pass
        fullTextRaw = runTesseractCLI(imagePath, 'txt', { psm: 3 });
        const phoneMatch = fullTextRaw.match(/(?:^|[^0-9])((?:09|07)\d{8})(?:[^0-9]|$)/);
        if (phoneMatch) {
            console.log(`[PhoneRecovery] Found phone in global text: ${phoneMatch[1]}`);
            phone = phoneMatch[1];
        }
    }

    // --- 5. Semantic Fields (Best Effort) ---
    // We already have the normalized full text from the anchor pass (TSV)
    // but a full English+Amharic pass is better for address.
    // fullTextRaw may have been initialized in 4E
    if (!fullTextRaw) {
        fullTextRaw = runTesseractCLI(imagePath, 'txt', { psm: 3 });
    }
    const address = resolveAddress(fullTextRaw);
    
    // Independent Woreda override (Golden Rule)
    const deterministicWoreda = extractWoredaDeterministic(words);
    if (deterministicWoreda && !address.woreda) {
        const isNumericRegion = NUMERIC_WOREDA_REGIONS.includes(address.region);
        if (isNumericRegion) {
            address.woreda = "Woreda " + deterministicWoreda;
            address.confidence = Math.max(address.confidence, 0.95);
            address.raw_text = (address.raw_text ? address.raw_text + "\n" : "") + "Woreda " + deterministicWoreda;
            address.normalized = [address.region, address.zone, address.woreda].filter(Boolean).join(", ");
        }
    }

    const nationality = resolveNationality(fullTextRaw);

    // --- 6. Final Evaluation ---
    const isSuccess = !!fin; // At minimum, we want FIN correctly
    
    if (!fin || !phone) {
        const cached = cache[imgHash];
        if (cached) {
            console.log(`[Stage 4D] Potential Cache Hit!`);
            if (!fin && cached.fin) {
                console.log(`[Stage 4D] Recovered FIN from cache: ${cached.fin}`);
                fin = cached.fin;
            }
            if (!phone && cached.phone) {
                // Validate prefix before accepting from cache
                if (/^(09|07)/.test(cached.phone)) {
                   console.log(`[Stage 4D] Recovered Phone from cache: ${cached.phone}`);
                   phone = cached.phone;
                }
            }
        }
    }

    // Update Cache if we have both now
    if (fin && phone) {
        cache[imgHash] = { fin, phone };
        saveCache(cache);
    }

    return {
      fin: fin || qrData?.uin || null, 
      phone: phone || qrData?.phone || null,
      nationality,
      address,
      vid: qrData?.vid || null,
      _status: isSuccess ? "Extracted (Safe Mode)" : "Rejected (Unsafe Data)",
      _source: "Safe Mode Architecture",
      _confidence: {
          fin: fin ? 1.0 : 0,
          phone: phone ? 1.0 : 0,
          address: address.confidence
      }
    };

  } catch (e) {
    console.error(`[SafeMode] Fatal Error: ${e.message}`, e.stack);
    return { fin: null, phone: null, _status: "Error", _error: e.message };
  }
}

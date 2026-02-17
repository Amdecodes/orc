import { runTesseractCLI, parseTSV } from "./cli_ocr.js";
import fs from "fs";

const AMH_ANCHORS = [
  /ሙሉ/,
  /ስም/,
  /ስሜ/,
];

const ENG_ANCHORS = [
  /full/i,
  /name/i,
];

export function findAnchor(words) {
  let candidates = [];

  for (const w of words) {
    const t = (w.text || "").trim();
    if (!t) continue;

    let score = 0;

    if (AMH_ANCHORS.some(r => r.test(t))) score += 2;
    if (ENG_ANCHORS.some(r => r.test(t))) score += 1;

    if (score > 0 && w.bbox) {
      candidates.push({ ...w, score });
    }
  }

  if (candidates.length === 0) return null;

  // Prefer top-most, highest score
  // Sort by score (desc), then by y0 (asc)
  return candidates.sort((a, b) =>
    b.score - a.score || a.bbox.y0 - b.bbox.y0
  )[0];
}

/**
 * Detects if a word/line is likely inside the QR code region (Bottom-Right).
 */
export function isInQRZone(y, x, meta) {
  // QR is typically in the Bottom 50% and Right 40%
  const isBottom = y > meta.height * 0.5;
  const isRight = x > meta.width * 0.6;
  return isBottom && isRight;
}

export function findBestAnchor(text, imageMeta) {
  if (!text) return null;

  const lines = text.split('\n'); // Keep empty lines for index checks
  const candidates = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let score = 0;
    let type = null; // Initialize type once

    // 2. Keyword Match Score (Primary vs Secondary)
    const normalized = line.replace(/\s+/g, " ");

    if (/ሙሉ.?ስም|Full.?Name/i.test(normalized)) {
      score += 10;
      type = 'primary';
    } else if (/የትውልድ.?ቀን|Date.?of.?Birth/i.test(normalized)) {
      score += 5;
      // Boost if BOTH parts match (stronger signal)
      if (/Date/i.test(normalized) && /Birth/i.test(normalized)) score += 3;
      type = 'secondary';
    } else {
      // Skip irrelevant lines early to save processing
      continue;
    }

    // 3. Context Score: Position
    // Full Name is usually in the top 30-60% of lines?
    // Let's just penalize very bottom lines for Primary
    const relativePos = i / lines.length;
    if (type === 'primary' && relativePos < 0.6) score += 2;
    
    // 4. Content Score: Amharic Density (Bonus)
    // If the identifying line ITSELF has Amharic, it's more likely a valid label
    if (/[\u1200-\u137F]/.test(line)) score += 1;

    // 5. Noise Penalty
    // If line has digits, it might be a noisy read (e.g. "40 Full Name")
    // or a different field (Date). "Full Name" label shouldn't have digits.
    if (/\d/.test(line)) score -= 2;
    
    candidates.push({
      text: line,
      lineIndex: i,
      score,
      type
    });
  }

  // Sort by Score DESC
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) return null;

  const best = candidates[0];
  const lineHeight = imageMeta.height / lines.length;
  
  // Calculate approxY
  // For 'primary', the name is below. For 'secondary', it's above.
  // We'll return the anchor Y, and let crop.js handle the offset.
  const y = Math.floor(best.lineIndex * lineHeight);

  return {
    ...best,
    approxY: y,
    totalLines: lines.length
  };
}
// --- BACK SIDE ANCHORS ---

/**
 * Scans for all back-side field anchors in one pass.
 * @returns {Map<string, object>} Map of field names to anchor objects
 */
export function findBackAnchors(text, imageMeta) {
  if (!text) return new Map();

  const lines = text.split('\n');
  const anchors = new Map();
  const lineHeight = imageMeta.height / (lines.length || 1);

  // Field definitions for the back side
  const FIELD_DEFS = [
    { id: 'phone', regex: /\b(?:Phone|Mobile|Mbile|Phne|Moblie|Mobi|ስልክ)\b/i, scoreBoost: 10 },
    { id: 'fin', regex: /\b(?:FIN|UIN|ID|ካርድ|F[|1]?N)\b|ቁጥር/i, scoreBoost: 10 },
    { id: 'address', regex: /\b(?:Address|Addres|Adres|Region|Zone|Woreda|አድራሻ|ክልል|ዞን|ወረዳ)\b/i, scoreBoost: 10 },
    { id: 'nationality', regex: /\b(?:Nationality|Nationalit|Nation|ዜግነት)\b/i, scoreBoost: 10 }
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const approxY = Math.floor(i * lineHeight);
    
    for (const def of FIELD_DEFS) {
      if (def.regex.test(line)) {
        let score = def.scoreBoost;
        
        // Penalize if it's likely deep in the QR zone (bottom-right)
        // Labels are usually on the left half
        // Since we don't have X, we just use Y for now.
        if (approxY > imageMeta.height * 0.7) score -= 5; 

        // Amharic glyphs in the label line are a strong signal
        if (/[\u1200-\u137F]/.test(line)) score += 3;

        const currentBest = anchors.get(def.id);
        if (!currentBest || score > currentBest.score) {
          anchors.set(def.id, {
            text: line,
            lineIndex: i,
            score: score,
            approxY: approxY,
            type: 'back-field',
            totalLines: lines.length
          });
        }
      }
    }
  }

  // Fallback for Phone: Look for "09" patterns directly if no label found
  if (!anchors.has('phone')) {
    const rawMatch = lines.findIndex(l => /\b09\d{8}\b/.test(l));
    if (rawMatch !== -1) {
      anchors.set('phone', {
        text: lines[rawMatch],
        lineIndex: rawMatch,
        score: 5,
        approxY: Math.floor(rawMatch * lineHeight),
        type: 'fallback',
        totalLines: lines.length
      });
    }
  }

  return anchors;
}

/**
 * Calculates a crop rectangle focused on the region below or beside an anchor.
 */
export function getDynamicCrop(anchor, imageMeta, fieldType) {
    const { approxY, totalLines } = anchor;
    const { width, height } = imageMeta;
    const lineHeight = height / totalLines;

    const crop = {
        left: 0,
        top: 0,
        width: width,
        height: Math.floor(lineHeight * 1.5) // Default to 1.5 lines height
    };

    switch (fieldType) {
        case 'address':
            // Addresses are often multi-line, take 3 lines below anchor
            crop.top = Math.max(0, approxY - 5); // Slight buffer above
            crop.height = Math.floor(lineHeight * 3.5);
            crop.left = Math.floor(width * 0.05);
            crop.width = Math.floor(width * 0.9);
            break;
        case 'nationality':
            crop.top = Math.max(0, approxY - 5);
            crop.left = Math.floor(width * 0.3); // Usually starts mid-way
            crop.width = Math.floor(width * 0.6);
            break;
        case 'phone':
        case 'fin':
            crop.top = Math.max(0, approxY - 5);
            crop.left = Math.floor(width * 0.2); 
            crop.width = Math.floor(width * 0.7);
            break;
    }

    // Sanitize
    crop.left = Math.max(0, crop.left);
    crop.top = Math.max(0, crop.top);
    crop.width = Math.min(width - crop.left, crop.width);
    crop.height = Math.min(height - crop.top, crop.height);

    return crop;
}

/**
 * Uses Tesseract CLI to find specific labels and their bounding boxes.
 * @param {Buffer} imageBuffer - Normalized image buffer.
 * @returns {Promise<Map<string, object>>} Map of label IDs to bbox objects.
 */
export async function findLabelsInTSV(imageBuffer) {
    const tempPath = `/tmp/label_scan_${Date.now()}.png`;
    fs.writeFileSync(tempPath, imageBuffer);
    
    // Run Tesseract CLI with PSM 1 (Auto with OSD) or 3 (Fully auto)
    // We want layout analysis.
    const tsvData = runTesseractCLI(tempPath, 'tsv', { psm: 3 });
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    
    if (!tsvData) return new Map();
    
    const words = parseTSV(tsvData);
    const labels = new Map();
    
    const DEFS = [
        { id: 'phone', regex: /\b(?:Phone|Mobile|ስልክ)\b/i },
        { id: 'fin', regex: /\b(?:FIN|UIN|F[I|1|L]?N)\b|ቁጥር/i },
        { id: 'nationality', regex: /\b(?:Nationality|ዜግነት)\b/i },
        { id: 'address', regex: /\b(?:Address|አድራሻ)\b/i }
    ];

    // Find words matching labels
    for (const def of DEFS) {
        // Multi-word label matching (e.g. "Phone" "Number")
        // For now, simple single-word or substring match in text
        const matches = words.filter(w => w.level === 5 && def.regex.test(w.text));
        
        if (matches.length > 0) {
            // Pick the best one (contextually relevant)
            // Labels are usually on the left side (x < 40%)
            const best = matches.sort((a,b) => {
                const aLeft = a.bbox.x0;
                const bLeft = b.bbox.x0;
                // Prefer left-most
                return aLeft - bLeft;
            })[0];
            
            labels.set(def.id, best);
        }
    }

    return labels;
}

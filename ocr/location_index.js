import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve path to et.json (one level up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ET_JSON_PATH = path.join(__dirname, '../et.json');

let LOCATION_INDEX = null;

// Helper normalization function
function norm(str) {
  if (!str) return "";
  return str.toString().toLowerCase().trim();
}

/**
 * Normalize OCR output aggressively to match the index.
 */
export function normalizeOCR(text) {
  return norm(text)
    .replace(/\bwereda\b/g, "woreda")
    .replace(/\bzone\b/g, "")
    .replace(/\bregion\b/g, "")
    .replace(/\bsubcity\b/g, "")
    .replace(/\bkifle ketema\b/g, "")
    .replace(/\bliyu\b/g, "")
    .replace(/\bspecial\b/g, "")
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Build a flat OCR index from the nested location data.
 * Keys now carry weight and type information.
 */
function buildLocationIndex(locations) {
  const index = [];

  for (const r of locations) {
    for (const z of r.zones) {
      const woredas = z.woredas || [];
      
      for (const w of woredas) {
        const keys = [];
        
        // Region Keys (Weight 3)
        if (r.region.en) keys.push({ text: normalizeOCR(r.region.en), weight: 3, type: 'region' });
        if (r.region.am) keys.push({ text: normalizeOCR(r.region.am), weight: 3, type: 'region' });
        
        // Zone Keys (Weight 2)
        if (z.zone.en) keys.push({ text: normalizeOCR(z.zone.en), weight: 2, type: 'zone' });
        if (z.zone.am) keys.push({ text: normalizeOCR(z.zone.am), weight: 2, type: 'zone' });
        
        // Woreda Keys (Weight 1)
        if (w.en) keys.push({ text: normalizeOCR(w.en), weight: 1, type: 'woreda' });
        if (w.am) keys.push({ text: normalizeOCR(w.am), weight: 1, type: 'woreda' });

        index.push({
          region: r.region,
          zone: z.zone,
          woreda: w,
          keys: keys
        });
      }
    }
  }

  return index;
}

/**
 * Load and build the index if not already built.
 */
function getOrBuildIndex() {
  if (LOCATION_INDEX) return LOCATION_INDEX;

  try {
    const rawData = fs.readFileSync(ET_JSON_PATH, 'utf-8');
    const locations = JSON.parse(rawData);
    LOCATION_INDEX = buildLocationIndex(locations);
    return LOCATION_INDEX;
  } catch (err) {
    console.error("Failed to load location index form et.json:", err);
    return [];
  }
}

/**
 * Match OCR text against reference index.
 * Returns the best match with confidence score and partial resolution.
 */
export function matchLocation(ocrText) {
  if (!ocrText) return null;
  
  const index = getOrBuildIndex();
  const text = normalizeOCR(ocrText);
  // Ignore tiny tokens < 2 chars to avoid noise (e.g. "a", "I")
  const inputTokens = text.split(" ").filter(t => t.length >= 2);

  // FIX: Addis Ababa subcity shortcut
  // If text contains "subcity", "ketema", "kifle", likely Addis or major city
  const isAddisHint = /subcity|ketema|kifle/i.test(ocrText);

  let bestEntry = null;
  let bestScore = -Infinity;
  let bestMatches = { region: false, zone: false, woreda: false };

  for (const entry of index) {
    let score = 0;
    let matchedTypes = { region: false, zone: false, woreda: false };

    for (const key of entry.keys) {
      if (!key.text) continue;

      // Token-based matching: ALL significant tokens of the key must match input
      const keyTokens = key.text.split(" ").filter(t => t.length >= 2);
      if (keyTokens.length === 0) continue; 

      const allTokensMatch = keyTokens.every(kt => inputTokens.some(it => it.includes(kt)));
      
      if (allTokensMatch) {
        score += key.weight;
        matchedTypes[key.type] = true;
      }
    }

    // FIX: Addis Ababa penalty
    if (entry.region.en === "Addis Ababa" && score < 5) {
      score -= 2;
    }

    if (isAddisHint && entry.region.en === "Addis Ababa") {
      score += 1; // Slight boost
    }

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
      bestMatches = matchedTypes;
    }
  }

  // Threshold Logic
  const isStrongMatch = (bestScore >= 5);
  // Relaxed Structural Match: 
  // If we matched Region(3) (Sidama) + Zone(2) (Mehal Sidama) = 5.
  // If we matched Zone(2) + Woreda(1) = 3.
  const isStructuralMatch = (bestScore >= 3 && (bestMatches.zone || bestMatches.woreda));

  if (bestEntry && (isStrongMatch || isStructuralMatch)) {
    return {
      region: bestEntry.region,
      zone: bestEntry.zone,
      woreda: bestMatches.woreda ? bestEntry.woreda : null,
      confidence: Number((bestScore / 6).toFixed(2)),
      raw_ocr: ocrText
    };
  }

  return null;
}

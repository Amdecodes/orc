import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toTitleCase, sanitizeAmharicText } from './ocr_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ET_JSON_PATH = path.join(__dirname, '..', 'config', 'et.json');

let LOCATION_DATA = null;

// Regions where Woredas are typically just numbers (01, 02...)
export const NUMERIC_WOREDA_REGIONS = ["Addis Ababa", "Dire Dawa", "Sheger", "Hareri"];

/**
 * Load and cache the location data.
 * Returns a hierarchical object: { "Region": { am: "...", zones: { "Zone": ... } } }
 */
function getLocationData() {
  if (LOCATION_DATA) return LOCATION_DATA;
  try {
    const rawData = fs.readFileSync(ET_JSON_PATH, 'utf-8');
    LOCATION_DATA = JSON.parse(rawData);
    return LOCATION_DATA;
  } catch (err) {
    console.error("Failed to load et.json:", err);
    return {};
  }
}

/**
 * Enhanced Normalization for English matching.
 */
function normalizeEnglish(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[\n\r]/g, " ")
    .replace(/\b(subcity|sub city|town administration|city administration|kifle ketema)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Enhanced Normalization for Amharic matching.
 */
function normalizeAmharic(text) {
  if (!text) return "";
  const sanitized = sanitizeAmharicText(text);
  return sanitized
    .replace(/ክፍለ ከተማ|ከተማ/g, "")
    .replace(/[^\u1200-\u137F\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Helper to check if a pattern matches as a whole word/token in text.
 */
function containsWord(text, pattern) {
  if (!pattern || pattern.length < 2) return false;
  // Escape regex special chars
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match as whole word (boundary or start/end)
  const regex = new RegExp(`(?:^|[\\s,.:;፡])(${escaped})(?=[\\s,.:;፡]|$)`, "i");
  return regex.test(text);
}

/**
 * PRODUCTION-GRADE matching logic.
 * Follows Region -> Zone -> Woreda hierarchy with English-keyed Amharic lookup.
 */
export function matchLocation(ocrText) {
  if (!ocrText) return null;

  const data = getLocationData(); // Object
  const normEn = normalizeEnglish(ocrText);
  const normAm = normalizeAmharic(ocrText);

  const result = {
    region: null,
    region_am: null,
    zone: null,
    zone_am: null,
    woreda: null,
    woreda_am: null,
    confidence: 0,
    raw_ocr: ocrText
  };

  // 1. Region Detection
  let regionName = null;
  let regionData = null;
  let regionMatchScore = 0;

  for (const rName of Object.keys(data)) {
    const rData = data[rName];
    // Relaxed Check: If OCR includes the Region Key (case-insensitive)
    // The key is now "Addis Ababa", "Amhara", etc.
    const rKeyNorm = normalizeEnglish(rName);
    const rAmNorm = normalizeAmharic(rData.am || "");

    if (containsWord(normEn, rKeyNorm)) {
      regionName = rName;
      regionData = rData;
      regionMatchScore = 0.95;
      break; 
    }
    if (rAmNorm.length > 1 && containsWord(normAm, rAmNorm)) {
      regionName = rName;
      regionData = rData;
      regionMatchScore = 1.0;
      break;
    }
  }

  if (!regionData) return null;

  result.region = regionName; // Key is already Title Case usually
  result.region_am = regionData.am;
  result.confidence = regionMatchScore;

  // 2. Zone Detection (Within Region)
  let zoneName = null;
  let zoneData = null;
  let zoneScore = 0;

  if (regionData.zones) {
    const zoneKeys = Object.keys(regionData.zones);
    
    // Attempt match
    for (const zName of zoneKeys) {
      const zData = regionData.zones[zName];
      const zKeyNorm = normalizeEnglish(zName);
      const zAmNorm = normalizeAmharic(zData.am || "");
      
      // Check Aliases if present
      const aliases = zData.aliases || [];
      const aliasMatch = aliases.some(a => containsWord(normEn, normalizeEnglish(a)));

      if (containsWord(normEn, zKeyNorm) || aliasMatch) {
        zoneName = zName;
        zoneData = zData;
        zoneScore = 0.95;
        break;
      }
      if (zAmNorm.length > 1 && containsWord(normAm, zAmNorm)) {
        zoneName = zName;
        zoneData = zData;
        zoneScore = 1.0;
        break;
      }
    }

    // Auto-select if only 1 zone exists (e.g. Dire Dawa, Harari)
    if (!zoneData && zoneKeys.length === 1) {
       zoneName = zoneKeys[0];
       zoneData = regionData.zones[zoneName];
       zoneScore = 0.5; // Implicit match
    }
  }

  if (zoneData) {
    // Clean zone name for output (key is already clean from refactor)
    result.zone = zoneName;
    result.zone_am = zoneData.am;
    result.confidence = (result.confidence + zoneScore) / 2;

    // 3. Woreda Detection (Within Zone)
    if (zoneData.woredas) {
      const wKeys = Object.keys(zoneData.woredas);
      let foundWoredaKey = null;
      let foundWoredaAm = null;
      
      // CASE A: Numeric Woreda Pattern "Woreda 01", "Woreda 02"...
      // STRICT REQUIREMENT: Must have "Woreda" prefix in English or Amharic to avoid header noise "04".
      // Look for: (Woreda|Wereda|ወረዳ) [space]* (digits)
      // Or: (digits) [space]* (Woreda|Wereda|ወረዳ) (e.g. 01 Woreda)
      
      const strictNumMatch = ocrText.match(/(?:Woreda|Wereda|Kebele|ወረዳ)\s*(0?[1-9]|[12][0-9]|30)\b/i) || 
                             ocrText.match(/\b(0?[1-9]|[12][0-9]|30)\s*(?:Woreda|Wereda|Kebele|ወረዳ)/i);

      if (strictNumMatch) {
          const numStr = strictNumMatch[1].padStart(2, '0'); // "01"
          const targetKeyRaw = "Woreda " + numStr; // "Woreda 01"
          
          if (zoneData.woredas[targetKeyRaw]) {
              foundWoredaKey = targetKeyRaw;
              foundWoredaAm = zoneData.woredas[targetKeyRaw];
          } 
          else if (NUMERIC_WOREDA_REGIONS.includes(regionName)) {
               foundWoredaKey = targetKeyRaw;
               foundWoredaAm = "ወረዳ " + numStr;
          }
      }

      // CASE B: Named Woreda / Key Lookup
      // Only if strict numeric failed. 
      if (!foundWoredaKey) {
        for (const wName of wKeys) {
            // Skip "Woreda XX" keys here, we handled them in Case A
            if (wName.startsWith("Woreda ")) continue;

            const wValAm = zoneData.woredas[wName];
            const wEnNorm = normalizeEnglish(wName);
            const wAmNorm = normalizeAmharic(wValAm || "");

            if (containsWord(normEn, wEnNorm)) {
                foundWoredaKey = wName;
                foundWoredaAm = wValAm;
                break;
            }
            if (wAmNorm.length > 1 && containsWord(normAm, wAmNorm)) {
                foundWoredaKey = wName;
                foundWoredaAm = wValAm;
                break;
            }
        }
      }

      if (foundWoredaKey) {
          result.woreda = foundWoredaKey; // Key is "Woreda 01" or Name
          result.woreda_am = foundWoredaAm;
          result.confidence = Math.min(1.0, result.confidence + 0.1);
      }
    }
  }

  return result;
}

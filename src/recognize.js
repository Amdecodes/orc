import { createWorker } from "tesseract.js";

// Helper: Score a single line of text
function scoreLine(rawLine, variantName) {
  if (!rawLine || rawLine.length < 2) return { score: -1, valid: false, reason: "Too short" };

  // 1. Scrub Keywords (Labels that might be in the crop)
  let scrubbed = rawLine.replace(/full\s*name|ሙሉ\s*ስም|Name|Date|Birth|የትውልድ|ቀን|Gender|Sex|ፆታ|Expires|የሚያበቃበት/gi, "")
                        .replace(/[:.|-]/g, "")
                        .trim();

  // 2. Clean to Amharic-only for final result
  const clean = scrubbed.replace(/[^ሀ-ፐ\s]/g, "").replace(/\s+/g, " ").trim();
  const amharicChars = (clean.match(/[ሀ-ፐ]/g) || []).length;
  const words = clean.split(/\s+/).filter(w => w.length > 0).length;
  
  // 3. Density Check
  // We check how much of the original line (after keyword scrub) is Amharic.
  // If there's lots of leftover Latin noise, density will be low.
  const density = amharicChars / (scrubbed.replace(/\s/g, "").length || 1);
  
  if (amharicChars < 3) return { score: 0, valid: false, reason: "Too few chars", clean };
  if (density < 0.5) return { score: 1, valid: false, reason: "Low Amharic Density", clean };

  // 4. Garbage Pattern detection (e.g. repeated characters like "ነነነ")
  const hasRepetition = /(.)\1\1/.test(clean); // 3 identical chars in a row
  
  // 5. Logical Scoring
  let baseScore = amharicChars; 
  if (words >= 2 && words <= 4) baseScore += 10; // Ideal name length
  else if (words === 1) baseScore -= 5;
  else if (words > 4) baseScore -= 10;

  if (hasRepetition) baseScore -= 15; // Heavy garbage penalty

  // 6. Density Weighting
  // High density (cleaner lines) should win even if char count is slightly lower
  let score = baseScore * density;

  // 7. Variant Boost
  // PSM 7 (Line) is specifically tuned for single lines, give it a tiny nudge
  if (variantName === 'Line') score += 1;

  return { score, valid: true, clean, words, variantName, raw: rawLine, density };
}

// Helper: Run Tesseract with specific PSM
// Helper: Run Tesseract with specific PSM and Options
async function recognizeVariant(imagePath, crop, psm, options = {}, externalWorker = null) {
  const worker = externalWorker || await createWorker("amh"); // Base language
  try {
    const params = {
      // tessedit_pageseg_mode: psm, // Commented out to test default
      preserve_interword_spaces: "1",
      tessedit_char_whitelist: options.whitelist || "" // Explicitly clear if not provided
    };

    if (psm) console.log(`DEBUG: Ignoring PSM ${psm} to test default.`);

    await worker.setParameters(params);
    
    const recognizeOptions = {
      blocks: true,
      hocr: true,
      tsv: true,
      box: true,
      ...options
    };
    if (crop) recognizeOptions.rectangle = crop;
    
    const { data } = await worker.recognize(imagePath, recognizeOptions);

    if (options.returnBoxes) {
      if (data && data.text) {
         // console.log(`DEBUG: Tesseract returned text length: ${data.text.length}`);
      } else {
          console.log("DEBUG: Tesseract returned NO text.");
      }

      let lines = [];
      if (data.lines && data.lines.length > 0) {
          lines = data.lines;
      } else if (data.blocks && data.blocks.length > 0) {
          // Traverse blocks -> paragraphs -> lines
          data.blocks.forEach(block => {
              if (block.paragraphs) {
                  block.paragraphs.forEach(p => {
                      if (p.lines) {
                          lines.push(...p.lines);
                      }
                  });
              }
          });
      } else if (data.tsv && data.tsv.length > 0) {
          // Fallback: Parse TSV
          // console.log("DEBUG: Parsing TSV for lines..."); // Removed verbose log
          const rows = data.tsv.split('\n');
          const header = rows[0].split('\t');
          const lineMap = new Map(); // key: "block-para-line" -> { textParts: [], bbox: {} }

          // Find indices
          const idx = {
              level: header.indexOf('level'),
              block: header.indexOf('block_num'),
              para: header.indexOf('par_num'),
              line: header.indexOf('line_num'),
              left: header.indexOf('left'),
              top: header.indexOf('top'),
              width: header.indexOf('width'),
              height: header.indexOf('height'),
              conf: header.indexOf('conf'),
              text: header.indexOf('text')
          };

          for (let i = 1; i < rows.length; i++) {
              const row = rows[i].split('\t');
              if (row.length < header.length) continue;
              
              const level = parseInt(row[idx.level]);
              if (level !== 5) continue; // level 5 is word

              const blockNum = row[idx.block];
              const paraNum = row[idx.para];
              const lineNum = row[idx.line];
              const key = `${blockNum}-${paraNum}-${lineNum}`;

              const text = row[idx.text];
              const conf = parseFloat(row[idx.conf]);
              const bbox = {
                  x0: parseInt(row[idx.left]),
                  y0: parseInt(row[idx.top]),
                  x1: parseInt(row[idx.left]) + parseInt(row[idx.width]),
                  y1: parseInt(row[idx.top]) + parseInt(row[idx.height])
              };

              if (!lineMap.has(key)) {
                  lineMap.set(key, { 
                      textParts: [], 
                      words: [],
                      bbox: { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
                      confidenceSum: 0,
                      wordCount: 0
                  });
              }

              const lineEntry = lineMap.get(key);
              lineEntry.textParts.push(text);
              lineEntry.words.push({ text, confidence: conf, bbox });
              lineEntry.confidenceSum += conf;
              lineEntry.wordCount++;
              
              // Update line bbox
              lineEntry.bbox.x0 = Math.min(lineEntry.bbox.x0, bbox.x0);
              lineEntry.bbox.y0 = Math.min(lineEntry.bbox.y0, bbox.y0);
              lineEntry.bbox.x1 = Math.max(lineEntry.bbox.x1, bbox.x1);
              lineEntry.bbox.y1 = Math.max(lineEntry.bbox.y1, bbox.y1);
          }

          lines = Array.from(lineMap.values()).map(entry => ({
              text: entry.textParts.join(' '),
              confidence: entry.wordCount > 0 ? entry.confidenceSum / entry.wordCount : 0,
              bbox: entry.bbox,
              words: entry.words
          }));
          
          // console.log(`DEBUG: Parsed ${lines.length} lines from TSV.`); // Removed verbose log
      } 
      
      // FINAL FALLBACK: Raw Text Splitting
      if (lines.length === 0 && data.text) {
          console.log("DEBUG: Generating lines from raw text (Layout data missing).");
          lines = data.text.split('\n').map(text => ({
              text: text.trim(),
              confidence: 0, // Unknown
              bbox: null, // No box
              words: []
          })).filter(l => l.text.length > 0);
      } else if (lines.length === 0) { // Only log if no lines were found at all
          // console.log("DEBUG: data.blocks AND data.tsv are empty or missing."); // Removed verbose log
      }

      if (lines.length === 0) {
          console.log("DEBUG: No lines found in Tesseract data. Keys:", data ? Object.keys(data) : "null");
          return [];
      }

      return lines.map(line => ({
        text: line.text.trim(),
        confidence: line.confidence,
        bbox: line.bbox, // {x0, y0, x1, y1}
        words: line.words ? line.words.map(w => ({
          text: w.text,
          bbox: w.bbox,
          confidence: w.confidence
        })) : []
      })).filter(l => l.text.length > 0);
    }

    return data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  } finally {
    if (!externalWorker) await worker.terminate();
  }
}

// Main function: Multi-Pass Line-based Scoring
export async function recognizeName(imagePath, crop) {
  const variants = [
    { psm: "6", name: "Block" },
    { psm: "7", name: "Line" }, 
    { psm: "3", name: "Auto" }
  ];

  let best = { score: -1, name: "", valid: false, error: "No candidates" };
  const allCandidates = [];

  for (const v of variants) {
    const lines = await recognizeVariant(imagePath, crop, v.psm);
    
    for (const line of lines) {
      const result = scoreLine(line, v.name);
      if (result.valid) {
        allCandidates.push(result);
      }
    }
  }

  // Sort by score descending
  allCandidates.sort((a, b) => b.score - a.score);

  // Debug: Show top candidates
  /*
  allCandidates.slice(0, 5).forEach(c => {
    console.log(`[PASS] variant=${c.variantName} score=${c.score.toFixed(1)} words=${c.words} text="${c.clean}" (raw="${c.raw.substring(0, 30)}...")`);
  });
  */

  if (allCandidates.length > 0) {
    const winner = allCandidates[0];
    return { 
      name: winner.clean, 
      valid: true, 
      score: winner.score, 
      variant: winner.variantName 
    };
  }

  return { name: "", valid: false, error: "Low confidence extraction", score: 0 };
}
// Helper: Score a single line of text with specific language preference
function scoreLineGeneral(rawLine, variantName, options = {}) {
  const { 
    preferredLanguage = 'am', 
    pattern = null,
    scrubKeywords = []
  } = options;

  if (!rawLine || rawLine.length < 2) return { score: -1, valid: false, reason: "Too short" };

  // 1. Scrub Keywords
  let scrubbed = rawLine;
  scrubKeywords.forEach(k => {
    scrubbed = scrubbed.replace(new RegExp(k, 'gi'), "");
  });
  scrubbed = scrubbed.replace(/[:.|-]/g, "").trim();

  // 2. Language Density Calculation
  const amharicChars = (scrubbed.match(/[\u1200-\u137F]/g) || []).length;
  const latinChars = (scrubbed.match(/[A-Za-z0-9]/g) || []).length;
  const words = scrubbed.split(/\s+/).filter(w => w.length > 0).length;
  const totalNonSpace = scrubbed.replace(/\s/g, "").length || 1;

  const amhDensity = amharicChars / totalNonSpace;
  const latDensity = latinChars / totalNonSpace;

  // 3. Score based on preference
  let baseScore;
  let density;
  
  if (preferredLanguage === 'any') {
    baseScore = amharicChars + latinChars;
    density = (amharicChars + latinChars) / totalNonSpace;
  } else {
    baseScore = preferredLanguage === 'am' ? amharicChars : latinChars;
    density = preferredLanguage === 'am' ? amhDensity : latDensity;
  }

  if (baseScore < 2) return { score: 0, valid: false, reason: "Too few chars", scrubbed };
  if (density < 0.3) return { score: 1, valid: false, reason: "Low Language Density", scrubbed };

  // 4. Pattern Match Bonus
  if (pattern && pattern.test(scrubbed)) {
    baseScore += 20; // Huge boost for matching expected pattern (09... or 12 digits)
  }

  // 5. Hallucination Penalty
  if (/(.)\1\1/.test(scrubbed)) baseScore -= 15;

  let score = baseScore * density;
  if (variantName === 'Line') score += 1;

  return { score, valid: true, text: scrubbed, words, variantName, density };
}

// Generalized recognition for any field
export async function recognizeField(imagePath, crop, options = {}, externalWorker = null) {
  const variants = [
    { psm: options.psm || (options.multiLine ? "6" : "7"), name: "Primary" },
    { psm: "3", name: "Auto" }
  ];

  // New: Return boxes directly if requested (bypassing scoring for now)
  if (options.returnBoxes) {
      const psmToUse = options.psm || variants[0].psm;
      // Pass the specific PSM we want (usually Primary or explicit)
      const boxes = await recognizeVariant(imagePath, crop, psmToUse, { ...options, returnBoxes: true }, externalWorker);
      return { lines: boxes, valid: true };
  }

  const allCandidates = [];
  const langPref = options.preferredLanguage || "am";
  const isMixed = langPref.includes("+") || langPref === "any";

  for (const v of variants) {
    const lines = await recognizeVariant(imagePath, crop, v.psm, options, externalWorker);
    for (const line of lines) {
      const result = scoreLineGeneral(line, v.name, {
          ...options,
          preferredLanguage: isMixed ? "any" : langPref
      });
      if (result.valid) {
        allCandidates.push(result);
      }
    }
  }

  if (allCandidates.length === 0) {
      return { text: "", valid: false, error: "Low confidence extraction" };
  }

  // If we want the full text (e.g. for address/full context)
  if (options.returnAll) {
      // De-duplicate lines and join
      const seen = new Set();
      const uniqueLines = [];
      
      // Sort candidates by their line position would be better, but we don't have it easily.
      // We'll trust the order from recognizeVariant (Auto PSM 3) for the Primary variant.
      const primaryLines = allCandidates.filter(c => c.variantName === "Primary");
      for (const c of (primaryLines.length > 0 ? primaryLines : allCandidates)) {
          if (!seen.has(c.text)) {
              uniqueLines.push(c.text);
              seen.add(c.text);
          }
      }
      
      return {
          text: uniqueLines.join('\n'),
          valid: true,
          score: Math.max(...allCandidates.map(c => c.score))
      };
  }

  allCandidates.sort((a, b) => b.score - a.score);
  const winner = allCandidates[0];
  let finalResult = winner.text;

  // 1. Regex Extraction (for Phone/FIN)
  if (options.pattern) {
    const match = winner.text.match(options.pattern);
    if (match) finalResult = match[0];
  }

  // 2. Semantic Validation (for Nationality/Address)
  if (options.fieldType === 'nationality' && !isNationality(finalResult)) {
      return { text: "", valid: false, error: "Not a nationality" };
  }

  return { 
    text: finalResult, 
    valid: true, 
    score: winner.score, 
    variant: winner.variantName 
  };
}

// Rule #3: Semantic Helpers
export function isNationality(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  // Ethiopian IDs specifically have "Ethiopian" or "ኢትዮጵያ"
  return (
    text.length < 20 && 
    (t.includes("ethiop") || t.includes("ኢትዮ"))
  );
}

export function isAddress(text) {
  if (!text) return false;
  // Rule out pure phone numbers being incorrectly caught as addresses
  if (/\b09\d{8}\b/.test(text) && text.length < 15) return false;
  
  // Addresses are usually multi-word
  const words = text.trim().split(/\s+/).length;
  return words >= 2 || text.length > 15;
}

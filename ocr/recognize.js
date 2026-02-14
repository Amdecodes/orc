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
async function recognizeVariant(imagePath, crop, psm) {
  const worker = await createWorker("amh");
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: psm,
      preserve_interword_spaces: "1"
    });
    const { data } = await worker.recognize(imagePath, { rectangle: crop });
    return data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  } finally {
    await worker.terminate();
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

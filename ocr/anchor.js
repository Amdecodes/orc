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

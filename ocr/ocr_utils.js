/**
 * Normalizes Amharic text for robust OCR matching.
 * Handles Unicode normalization and cleans up noisy diacritics.
 */
export function normalizeAmharic(text) {
  if (!text) return "";
  return text
    .normalize("NFC")
    // Keep Amharic, numbers, and basic punctuation that might be OCR'd
    .replace(/[^\u1200-\u137F0-9A-Za-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes English text for address matching.
 */
export function normalizeEnglish(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Titles cases a string.
 */
export function toTitleCase(str) {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

/**
 * Groups Tesseract TSV words into logical lines, splitting on line_num change
 * OR on semantic separators like '|'.
 */
export function groupWordsIntoLines(words) {
    const lines = [];
    let currentLineNum = -1;
    let currentLineWords = [];

    const flush = () => {
        if (currentLineWords.length === 0) return;
        const text = currentLineWords.map(w => w.text).join(" ");
        const bbox = {
            x0: Math.min(...currentLineWords.map(w => w.bbox.x0)),
            y0: Math.min(...currentLineWords.map(w => w.bbox.y0)),
            x1: Math.max(...currentLineWords.map(w => w.bbox.x1)),
            y1: Math.max(...currentLineWords.map(w => w.bbox.y1))
        };
        lines.push({ text, bbox });
        currentLineWords = [];
    };

    for (const w of words) {
        if (w.level === 5) {
            // Split on line_num change OR if word is a layout separator
            const isSeparator = /^[|!\[\]]$/.test(w.text.trim());
            
            if (currentLineNum !== -1 && (w.line_num !== currentLineNum || isSeparator)) {
                flush();
            }
            currentLineNum = w.line_num;
            if (isSeparator) continue;
            currentLineWords.push(w);
        }
    }
    flush();
    return lines;
}

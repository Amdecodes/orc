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

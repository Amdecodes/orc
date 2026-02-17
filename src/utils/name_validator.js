/**
 * AMHARIC NAME VALIDATOR
 * 
 * Rules:
 * - Ge'ez script only (\u1200 - \u137F)
 * - 2 to 4 words.
 * - 6 to 40 characters.
 */

import { sanitizeAmharicText } from './ocr_utils.js';

export function validateAmharicName(rawText) {
    if (!rawText) return { valid: false, score: 0, reason: "Empty input" };

    // 1. Sanitize (Trailing punctuation, whitespace)
    const sanitized = sanitizeAmharicText(rawText);

    // 2. Script Filter (Ethiopic block + spaces)
    const hasInvalidChars = /[A-Za-z0-9]/.test(sanitized);
    
    const clean = sanitized.replace(/[^\u1200-\u137F\s]/g, "").replace(/\s+/g, " ").trim();
    
    // 2. Character Length (excluding spaces)
    const charCount = clean.replace(/\s/g, "").length;
    
    // 3. Word Count
    const words = clean.split(" ").filter(w => w.length > 0);
    const wordCount = words.length;

    let score = 0;
    const reasons = [];

    // Script validation
    if (charCount >= 2 && !hasInvalidChars) {
        score += 0.4;
    } else if (hasInvalidChars) {
        reasons.push("Contains Latin/Numeric characters");
    } else {
        reasons.push("Too few Ethiopic characters");
    }

    // Word count validation [2, 4]
    if (wordCount >= 2 && wordCount <= 4) {
        score += 0.3;
    } else {
        reasons.push(`Invalid word count: ${wordCount}`);
    }

    // Length validation [6, 40]
    if (charCount >= 6 && charCount <= 40) {
        score += 0.3;
    } else {
        reasons.push(`Invalid character length: ${charCount}`);
    }

    const isValid = score >= 0.7;

    return {
        valid: isValid,
        score: parseFloat(score.toFixed(1)),
        clean,
        wordCount,
        charCount,
        reasons
    };
}

/**
 * Finds the best Amharic name candidate in a multi-line string.
 */
export function findBestNameCandidate(rawText) {
    if (!rawText) return null;
    
    // Split by common delimiters (newline, colons, bars)
    const lines = rawText.split(/[\n\r:|]+/).map(l => l.trim()).filter(l => l.length > 0);
    const results = lines.map(line => ({ line, ...validateAmharicName(line) }));
    
    // Sort by score descending
    const validResults = results.filter(r => r.valid).sort((a, b) => b.score - a.score);
    
    return validResults.length > 0 ? validResults[0] : null;
}

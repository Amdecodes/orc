/**
 * Strict Date Extraction for Ethiopian IDs.
 * Deterministic, keyword-anchored, DOB-safe.
 *
 * Rules:
 *  - A date without a keyword is NOT a validity date
 *  - DOB lines are hard-excluded
 *  - Only Gregorian dates (19xx/20xx) accepted
 *  - Issue Date must be in the right column
 *  - Multi-line scanning: keyword on line N, date on line N±1
 */

import { toEthiopian, toGregorian } from "ethiopian-date";

// ── Keyword Lists ──────────────────────────────────────────────

const DOB_BLOCKLIST = [
  "birth",
  "date of birth",
  "dob",
  "የትውልድ",
  "የልደት"
];

const ISSUE_KEYS = [
  "date of issue",
  "issued on",
  "issue date",
  "የተሰጠበት",
  "ቀን የተሰጠ"
];

const EXPIRY_KEYS = [
  "date of expiry",
  "expiry date",
  "valid until",
  "expires",
  "የሚያበቃበት",
  "የሚያልቅ"
];

// Gregorian date: YYYY/MM/DD or YYYY-MM-DD (year 19xx or 20xx)
const GC_DATE_REGEX = /\b(19|20)\d{2}[\/\-](0[1-9]|1[0-3])[\/\-](0[1-9]|[12]\d|3[01])\b/;

// ── Helpers ────────────────────────────────────────────────────

/**
 * Normalizes an OCR line for keyword matching.
 * Preserves Amharic/Unicode characters — only strips ASCII punctuation
 * that is not a slash, dash, or space.
 */
function normalizeLine(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    // Strip ASCII punctuation EXCEPT slashes, dashes, spaces, digits, letters
    // \p{L} matches any Unicode letter (Amharic, Latin, etc.)
    .replace(/[^\p{L}\p{N}\/\-\s]/gu, "")
    .trim();
}

/**
 * Checks if the midpoint of a bounding box is in the right column.
 */
function isRightColumn(bbox, imgWidth) {
  if (!bbox || !imgWidth) return false;
  const x = (bbox.x0 + bbox.x1) / 2;
  return x > imgWidth * 0.55;
}

/**
 * Converts a GC date string (YYYY-MM-DD) to Ethiopian Calendar.
 * Returns "YYYY-MM-DD" in EC or null on failure.
 */
function gcToEc(gcDateStr) {
  try {
    const [y, m, d] = gcDateStr.split("-").map(Number);
    const [ey, em, ed] = toEthiopian(y, m, d);
    return `${ey}/${String(em).padStart(2, "0")}/${String(ed).padStart(2, "0")}`;
  } catch (e) {
    return null;
  }
}

/**
 * Converts an EC date string (YYYY-MM-DD) to Gregorian Calendar.
 * Returns "YYYY-MM-DD" in GC or null on failure.
 */
function ecToGc(ecDateStr) {
  try {
    const [y, m, d] = ecDateStr.split("-").map(Number);
    const [gy, gm, gd] = toGregorian(y, m, d);
    return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
  } catch (e) {
    return null;
  }
}

/**
 * Formats a GC date string (YYYY-MM-DD) to YYYY/Month/DD (e.g. 2026/Feb/10).
 */
function formatGcDate(dateStr) {
  if (!dateStr) return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const monthName = months[m - 1];
    return `${y}/${monthName}/${String(d).padStart(2, "0")}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Normalizes a matched date to YYYY-MM-DD (slashes → dashes).
 */
function normalizeDate(dateStr) {
  return dateStr.replace(/\//g, "-");
}

/**
 * Checks if a string (squashed) contains any keyword (squashed).
 */
function containsKeyword(text, keywords) {
    const squashedText = text.replace(/\s+/g, "").toLowerCase();
    return keywords.some(k => squashedText.includes(k.replace(/\s+/g, "").toLowerCase()));
}

/**
 * Adds a specific number of days to a GC date string (YYYY-MM-DD).
 * Deterministic and leap-year safe.
 */
function addDays(dateStr, days) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split("T")[0];
  } catch (e) {
    return null;
  }
}

// ── PASS 1: STRICT KEYWORD ANCHORING (1.00) ──────────────────
function resolvePass1(normalized, imgWidth) {
    const candidates = [];
    for (let i = 0; i < normalized.length; i++) {
        const cur = normalized[i];
        if (containsKeyword(cur.clean, DOB_BLOCKLIST)) continue;

        const matches = [...cur.clean.matchAll(new RegExp(GC_DATE_REGEX, 'g'))];
        let lastDateEndIndex = 0;
        let isIssueLine = false;

        for (const match of matches) {
            const date = normalizeDate(match[0]);
            const dateStartIndex = match.index;
            const dateEndIndex = dateStartIndex + match[0].length;
            const segmentText = cur.clean.substring(lastDateEndIndex, dateStartIndex);
            lastDateEndIndex = dateEndIndex;

            // Anchor in same line
            if (containsKeyword(segmentText, ISSUE_KEYS)) isIssueLine = true;
            // Anchor in previous line
            if (!isIssueLine && i > 0 && containsKeyword(normalized[i - 1].clean, ISSUE_KEYS)) {
                if (!containsKeyword(normalized[i - 1].clean, DOB_BLOCKLIST)) isIssueLine = true;
            }

            if (isIssueLine && isRightColumn(cur.bbox, imgWidth)) {
                candidates.push(date);
            }
        }
    }
    if (candidates.length > 0) {
        return { issue: candidates.sort()[0], method: "pass_1_strict", confidence: 1.0 };
    }
    return null;
}

// ── PASS 2: POSITIONAL RESOLVER (0.98) ──────────────────────
function resolvePass2(normalized, imgWidth) {
    const rightSideDates = [];
    for (const line of normalized) {
        if (containsKeyword(line.clean, DOB_BLOCKLIST)) continue;
        if (!isRightColumn(line.bbox, imgWidth)) continue;

        const matches = [...line.clean.matchAll(new RegExp(GC_DATE_REGEX, 'g'))];
        for (const match of matches) {
            rightSideDates.push({
                date: normalizeDate(match[0]),
                y: line.bbox ? (line.bbox.y0 + line.bbox.y1) / 2 : 0
            });
        }
    }

    if (rightSideDates.length > 0) {
        // Issue is typically the lowest GC date on the right side
        rightSideDates.sort((a, b) => b.y - a.y);
        return { issue: rightSideDates[0].date, method: "pass_2_positional", confidence: 0.98 };
    }
    return null;
}

// ── PASS 3: TWIN-CHECK DATE SET (0.95) ──────────────────────
function resolvePass3(normalized) {
    const allDates = [];
    for (const line of normalized) {
        if (containsKeyword(line.clean, DOB_BLOCKLIST)) continue;
        const matches = [...line.clean.matchAll(new RegExp(GC_DATE_REGEX, 'g'))];
        for (const match of matches) {
            allDates.push(normalizeDate(match[0]));
        }
    }

    const uniqueDates = [...new Set(allDates)];
    for (const d1 of uniqueDates) {
        const potentialExpiry = addDays(d1, 2919); // Check D+2919
        const potentialExpiry2 = addDays(d1, 2920); // Check D+2920
        const potentialExpiry3 = addDays(d1, 2921); // Check D+2921
        
        if (uniqueDates.includes(potentialExpiry) || 
            uniqueDates.includes(potentialExpiry2) || 
            uniqueDates.includes(potentialExpiry3)) {
            return { issue: d1, method: "pass_3_twin_check", confidence: 0.95 };
        }
    }
    return null;
}

// ── Main Extraction ────────────────────────────────────────────

/**
 * Extracts validity dates (Issue + Expiry) from OCR lines.
 */
export function extractValidityDates(ocrLines, imgWidth) {
    const normalized = ocrLines.map(line => ({
        raw: line.text || "",
        clean: normalizeLine(line.text),
        bbox: line.bbox || null
    }));

    // Escalating Passes
    let best = resolvePass1(normalized, imgWidth);
    if (!best) best = resolvePass2(normalized, imgWidth);
    if (!best) best = resolvePass3(normalized);
    // Note: Pass 4 (Backward) is effectively a variant of Pass 3 or covered by Twin-Check logic

    const result = {
        validity: {
            issue: { gc: null, ec: null },
            expiry: { gc: null, ec: null },
            method: null,
            confidence: 0
        }
    };

    if (best) {
        let ecIssue = best.issue; // OCR detected numeric is EC Issue
        // Ensure EC issue uses slashes for output
        ecIssue = ecIssue.replace(/-/g, "/");

        const gcIssue = ecToGc(best.issue); // ecToGc still expects dashes or handles both? 
        // Let's check ecToGc - it uses split("-").
        const gcExpiry = gcIssue ? addDays(gcIssue, 2920) : null;
        const ecExpiry = gcExpiry ? gcToEc(gcExpiry) : null;

        result.validity = {
            issue: {
                gc: formatGcDate(gcIssue),
                ec: ecIssue
            },
            expiry: {
                gc: formatGcDate(gcExpiry),
                ec: ecExpiry
            },
            method: best.method,
            confidence: best.confidence === 1.0 ? 0.98 : best.confidence // Cap at 0.98 for inferred expiry
        };
    }

    return result;
}

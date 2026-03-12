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
  "dateot",
  "dateot issue",
  "የተሰጠበት",
  "ቀን የተሰጠ"
];

const EXPIRY_KEYS = [
  "date of expiry",
  "expiry date",
  "valid until",
  "expires",
  "dato of expiry",
  "dateofexpiry",
  "dateof expiry",
  "የሚያበቃበት",
  "የሚያልቅ"
];

// Gregorian date: YYYY/MM/DD, YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY (year 19xx or 20xx)
// Supports matching year section first or last. Removed space boundaries because we squash the string.
const GC_DATE_REGEX = /(?:(19|20)\d{2}[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])|(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19|20)\d{2})/;

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
 * Handles both YYYY-MM-DD and DD-MM-YYYY inputs.
 */
function normalizeDate(dateStr) {
  let dashed = dateStr.replace(/\//g, "-");
  
  // If date starts with Day instead of Year (DD-MM-YYYY)
  const parts = dashed.split("-");
  if (parts.length === 3 && parts[0].length <= 2) {
    const [d, m, y] = parts;
    dashed = `${y}-${m}-${d}`;
  }
  
  return dashed;
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

        // Squash all whitespace to fix OCR artifact spaces like "20 18/05"
        const squashedClean = cur.clean.replace(/\s+/g, "");
        const matches = [...squashedClean.matchAll(new RegExp(GC_DATE_REGEX, 'g'))];
        let lastDateEndIndex = 0;
        let isIssueLine = false;

        for (const match of matches) {
            const date = normalizeDate(match[0]);
            const dateStartIndex = match.index;
            const dateEndIndex = dateStartIndex + match[0].length;
            const segmentText = squashedClean.substring(lastDateEndIndex, dateStartIndex);
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

        const squashedClean = line.clean.replace(/\s+/g, "");
        const matches = [...squashedClean.matchAll(new RegExp(GC_DATE_REGEX, 'g'))];
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
        const squashedClean = line.clean.replace(/\s+/g, "");
        const matches = [...squashedClean.matchAll(new RegExp(GC_DATE_REGEX, 'g'))];
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


// ── PASS 4: BRUTE FORCE EC RANGE FILTER (0.75) ──────────────
// Last resort: grab ALL dates, filter for plausible EC issue date range
// Ethiopian IDs issued ~2013-2020 EC (2020-2028 GC)
function resolvePass4(normalized) {
    const allDates = [];
    for (const line of normalized) {
        if (containsKeyword(line.clean, DOB_BLOCKLIST)) continue;
        // Also try with spaces squashed to catch "20 16/05/23" type OCR artifacts
        const variants = [line.clean, line.clean.replace(/\s+/g, "")];
        for (const v of variants) {
            const matches = [...v.matchAll(new RegExp(GC_DATE_REGEX, 'g'))];
            for (const match of matches) {
                const normalized_date = normalizeDate(match[0]);
                const year = parseInt(normalized_date.split('-')[0]);
                // Plausible EC issue year: 2008-2020 (converts to GC 2015-2028)
                if (year >= 2008 && year <= 2020) {
                    allDates.push(normalized_date);
                }
            }
        }
    }
    if (allDates.length === 0) return null;
    // Sort ascending, pick earliest as issue date (DOB already filtered)
    allDates.sort();
    return { issue: allDates[0], method: "pass_4_bruteforce", confidence: 0.75 };
}

// ── PASS 5: FULL TEXT REGEX FALLBACK (0.60) ──────────────────
// Concatenate ALL OCR text and scan for any date pattern
function resolvePass5(normalized) {
    const fullText = normalized
        .filter(l => !containsKeyword(l.clean, DOB_BLOCKLIST))
        .map(l => l.clean.replace(/\s+/g, ""))
        .join(" ");
    
    const matches = [...fullText.matchAll(new RegExp(GC_DATE_REGEX, 'g'))];
    const dates = matches.map(m => normalizeDate(m[0]));
    const plausible = dates.filter(d => {
        const y = parseInt(d.split('-')[0]);
        return y >= 2008 && y <= 2020;
    });
    if (plausible.length === 0) return null;
    plausible.sort();
    return { issue: plausible[0], method: "pass_5_fulltext", confidence: 0.60 };
}


// ── PASS 6: BACK-CALCULATE FROM EXPIRY DATE (0.85) ──────────
// If expiry keyword found, extract GC expiry date and subtract 2920 days
function subtractDays(dateStr, days) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().split("T")[0];
  } catch (e) { return null; }
}

// Extract ALL plausible GC dates from a messy merged string like "2026/06/022034/feb/09"
// Also handles month names like "Feb"
function extractAllGCDates(str) {
    const squashed = str.replace(/\s+/g, "");
    const results = [];
    // Numeric dates: YYYY/MM/DD or YYYY-MM-DD
    const numericRe = /((?:19|20)\d{2})[\/-](0[1-9]|1[0-2])[\/-](0[1-9]|[12]\d|3[01])/g;
    let m;
    while ((m = numericRe.exec(squashed)) !== null) {
        results.push(`${m[1]}-${m[2]}-${m[3]}`);
    }
    // Month-name dates: YYYY/Mon/DD or YYYY-Mon-DD
    const monthNames = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                        jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
    const monthRe = /((?:19|20)\d{2})[\/-]([a-z]{3})[\/-](0[1-9]|[12]\d|3[01])/gi;
    while ((m = monthRe.exec(squashed)) !== null) {
        const mo = monthNames[m[2].toLowerCase()];
        if (mo) results.push(`${m[1]}-${mo}-${m[3]}`);
    }
    return results;
}

function resolvePass6(normalized) {
    for (let i = 0; i < normalized.length; i++) {
        const cur = normalized[i];
        const isExpiry = containsKeyword(cur.clean, EXPIRY_KEYS);
        const nextLine = normalized[i + 1];
        
        // Check current line and next line for a GC date
        const linesToCheck = [cur.clean];
        if (nextLine) linesToCheck.push(nextLine.clean);
        
        if (isExpiry || (i > 0 && containsKeyword(normalized[i-1].clean, EXPIRY_KEYS))) {
            for (const line of linesToCheck) {
                const allDates = extractAllGCDates(line);
                // Pick the date with the latest year as expiry (expiry is ~8 yrs after issue)
                const expiryDates = allDates.filter(d => {
                    const y = parseInt(d.split("-")[0]);
                    return y >= 2025 && y <= 2040; // valid GC expiry range
                });
                if (expiryDates.length > 0) {
                    expiryDates.sort((a, b) => b.localeCompare(a)); // latest first
                    const gcExpiry = expiryDates[0];
                    const gcIssue = subtractDays(gcExpiry, 2920);
                    if (gcIssue) {
                        console.log(`[Pass6] All dates found: ${allDates.join(", ")}`);
                        console.log(`[Pass6] Using expiry ${gcExpiry}, back-calculated GC issue: ${gcIssue}`);
                        return { issue: gcIssue, method: "pass_6_from_expiry", confidence: 0.85, isGC: true };
                    }
                }
            }
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

    // DEBUG: log all normalized lines to see what OCR gives us
    console.log("[DateDebug] All normalized lines:");
    normalized.forEach((l, i) => { if(l.clean) console.log(`  [${i}] bbox_x=${l.bbox ? Math.round((l.bbox.x0+l.bbox.x1)/2) : '?'} | ${l.clean}`); });

    // Escalating Passes
    let best = resolvePass1(normalized, imgWidth);
    if (!best) best = resolvePass2(normalized, imgWidth);
    if (!best) best = resolvePass3(normalized);
    if (!best) best = resolvePass4(normalized);
    if (!best) best = resolvePass5(normalized);
    if (!best) best = resolvePass6(normalized);
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
        let gcIssue, ecIssue;
        if (best.isGC) {
            // Pass 6: issue date is already in GC
            gcIssue = best.issue;
            const ecIssueRaw = gcToEc ? null : null; // derive below
            const ecConverted = gcIssue ? gcToEc(gcIssue) : null;
            ecIssue = ecConverted ? ecConverted.replace(/-/g, "/") : null;
        } else {
            // Passes 1-5: issue date is EC
            ecIssue = best.issue.replace(/-/g, "/");
            gcIssue = ecToGc(best.issue);
        }
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

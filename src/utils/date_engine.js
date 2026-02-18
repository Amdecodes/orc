/**
 * Refined Deterministic Date Extraction for Ethiopian Digital IDs.
 * 
 * Rules:
 * 1. Extract all date-like strings:
 *    - GC format: YYYY/month/DD (e.g., 2026/feb/10)
 *    - Numeric format: YYYY/MM/DD (e.g., 2024/01/01)
 * 2. Normalize all candidates to GC scale.
 * 3. Filter out DOB (compare against both dobGc and dobEc).
 * 4. Identification:
 *    - If multiple candidates: Smallest is Issue, others are Expiry candidates.
 *    - Validation: Confirm Issue + 2920 days matches an Expiry candidate.
 * 5. Deterministic Result:
 *    - Issue Date = Smallest non-DOB candidate.
 *    - Expiry Date = Issue Date + 2920 days.
 */

import { toEthiopian, toGregorian } from "ethiopian-date";

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const VALIDITY_DAYS = 2920;

/** Regex for GC labels like "2026/feb/10" */
const GC_LABEL_REGEX = /(?:19|20)\d{2}[\s\/\-](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s\/\-]\d{1,2}/gi;

/** Regex for numeric dates like "2024/01/01" */
const NUMERIC_DATE_REGEX = /(?:19|20)\d{2}[\s\/\-]\d{1,2}[\s\/\-]\d{1,2}/g;

/** Normalizes any detected date to YYYY-MM-DD (GC) */
function normalizeToGc(raw) {
    const clean = raw.toLowerCase().replace(/[\s\/\-]/g, "-");
    let [y, m, d] = clean.split("-");
    
    // Case 1: English Month (GC)
    const monthIdx = MONTH_NAMES.indexOf(m);
    if (monthIdx !== -1) {
        const mm = String(monthIdx + 1).padStart(2, "0");
        const dd = d.padStart(2, "0");
        return `${y}-${mm}-${dd}`;
    }
    
    // Case 2: Numeric (Could be GC or EC)
    // Rule: Year <= 2020 means EC, Year > 2020 means GC
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    
    if (year <= 2020) {
        try {
            const [gy, gm, gd] = toGregorian(year, month, day);
            return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
        } catch { return null; }
    }
    
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toDateObj(str) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function addDaysFn(dateStr, days) {
    const d = toDateObj(dateStr);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split("T")[0];
}

function gcToEc(gcStr) {
    try {
        const [y, m, d] = gcStr.split("-").map(Number);
        const [ey, em, ed] = toEthiopian(y, m, d);
        return `${ey}/${String(em).padStart(2, "0")}/${String(ed).padStart(2, "0")}`;
    } catch { return null; }
}

/**
 * Main Refined Engine
 */
export function extractValidityDates(ocrLines, dobGc = null, dobEc = null) {
    console.log(`[DateEngine] Refined scan. Filters: GC=${dobGc}, EC=${dobEc}`);
    
    const allText = ocrLines.map(l => (l.text || "")).join("\n");
    
    // Extract all matches
    const gcMatches = allText.match(GC_LABEL_REGEX) || [];
    const numMatches = allText.match(NUMERIC_DATE_REGEX) || [];
    const allRaw = [...new Set([...gcMatches, ...numMatches])];
    
    // 1. Normalize all to GC
    const candidates = allRaw
        .map(r => normalizeToGc(r))
        .filter(Boolean)
        .filter(d => d !== dobGc); // Filter GC DOB
    
    // 2. Extra EC DOB Filter (if EC dates were detected and normalized)
    // (Already handled by normalizeToGc which converts EC -> GC and then filters against dobGc)
    
    if (candidates.length === 0) {
        return { validity: { issue: { gc: null, ec: null }, expiry: { gc: null, ec: null }, method: "failure", confidence: 0 } };
    }
    
    // 3. Sort candidates (GC scale)
    const sorted = [...new Set(candidates)].sort();
    console.log(`[DateEngine] Final candidates (GC): [${sorted.join(", ")}]`);
    
    // 4. Identify Issue and Verify
    const issueGc = sorted[0]; // Smallest is always Issue
    const expiryGc = addDaysFn(issueGc, VALIDITY_DAYS);
    
    // Confirmation check
    const isConfirmed = sorted.some(d => d === expiryGc);
    console.log(`[DateEngine] Issue=${issueGc}. Confirmation match: ${isConfirmed}`);
    
    return {
        validity: {
            issue: { gc: issueGc, ec: gcToEc(issueGc) },
            expiry: { gc: expiryGc, ec: gcToEc(expiryGc) },
            method: isConfirmed ? "deterministic_confirmed" : "deterministic_single",
            confidence: isConfirmed ? 1.0 : 0.85
        }
    };
}

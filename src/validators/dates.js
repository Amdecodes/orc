import { toEthiopian } from "ethiopian-date";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Formats a GC date string (YYYY-MM-DD or YYYY/MM/DD) to YYYY/mon/DD.
 * Example: 2024-02-01 -> 2024/feb/01
 */
export function formatGcWithMonth(dateStr) {
    if (!dateStr || dateStr === "") return "";
    try {
        const normalized = dateStr.replace(/\//g, "-");
        const parts = normalized.split("-");
        if (parts.length < 3) return dateStr;
        
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const d = parts[2].padStart(2, "0");
        
        const monthShort = MONTHS[m - 1] || "???";
        return `${y}/${monthShort}/${d}`;
    } catch (e) {
        return dateStr;
    }
}

/**
 * Validates and Calculates Ethiopian ID Validity.
 * Rule: Expiry = Issue + 2921 days.
 */
export function calculateValidity(issueGcDate) {
    if (!issueGcDate) return null;

    try {
        // Ensure standard dash format (YYYY-MM-DD)
        const normalizedIssue = issueGcDate.replace(/\//g, "-");
        const [y, m, d] = normalizedIssue.split("-").map(Number);
        
        const date = new Date(Date.UTC(y, m - 1, d));
        
        // Add 2921 days as per user specification (7 years, 11 months, 30 days)
        date.setUTCDate(date.getUTCDate() + 2921);
        
        const expiryGc = date.toISOString().split("T")[0];
        
        return {
            issue: {
                gc: formatGcWithMonth(normalizedIssue),
                ec: gcToEc(normalizedIssue)
            },
            expiry: {
                gc: formatGcWithMonth(expiryGc),
                ec: gcToEc(expiryGc)
            },
            method: "derived_from_issue",
            confidence: 1.0
        };
    } catch (e) {
        console.error("Validity calculation error:", e);
        return null;
    }
}

/**
 * Global helper for GC -> EC conversion in YYYY/MM/DD format.
 */
export function gcToEc(gcDateStr) {
    if (!gcDateStr) return "";
    try {
        const normalized = gcDateStr.replace(/\//g, "-");
        const [y, m, d] = normalized.split("-").map(Number);
        const [ey, em, ed] = toEthiopian(y, m, d);
        return `${ey}/${String(em).padStart(2, "0")}/${String(ed).padStart(2, "0")}`;
    } catch (e) {
        return "";
    }
}

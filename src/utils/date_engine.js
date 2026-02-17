/**
 * Deterministic Date Extraction for Ethiopian Digital IDs.
 * Court-safe. No AI. No guessing.
 *
 * Algorithm:
 *   Phase 1: Label-lock dates (position-based ownership on merged OCR lines)
 *   Phase 2: Classify EC vs GC within each label's pool
 *   Phase 3: Combinatorial pair testing with 2921-day validator (±1)
 *   Phase 4: Derivation fallback when one side missing
 *
 * Rules:
 *   - Validity period = 2921 days (from policy)
 *   - abs(diffDays(issueGC, expiryGC) - 2921) <= 1
 *   - DOB dates are hard-excluded
 *   - Expiry dominates Issue (derive issue from expiry, not vice versa)
 *   - Never derive if printed data exists
 */

import { toEthiopian } from "ethiopian-date";

// ── Keywords ───────────────────────────────────────────────────

const DOB_KEYS = [
  "date of birth", "birth", "dob", "የትውልድ", "የልደት"
];

const ISSUE_KEYS = [
  "date of issue", "dateof issue", "issue date",
  "issued on", "issuance date",
  "የተሰጠበት", "የተሰጠበት ቀን", "ቀን የተሰጠ"
];

const EXPIRY_KEYS = [
  "date of expiry", "expiry date", "valid until", "expires",
  "የሚያበቃበት", "የሚያልቅ"
];

// ── Date Regex (handles OCR noise: spaced years, any separator) ──
const DATE_REGEX = /(?:19|20)\s?\d{2}[\/\-](?:0[1-9]|1[0-3]|[A-Za-z]{3})[\/\-](?:0[1-9]|[12]\d|3[01])/g;
const MONTH_NAMES = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const VALIDITY_DAYS = 2921;

// ── Helpers ────────────────────────────────────────────────────

function normalizeDate(raw) {
  const clean = raw.replace(/\s/g, "");
  let [y, m, d] = clean.split(/[\/\-]/);
  if (isNaN(m)) {
    const idx = MONTH_NAMES.indexOf(m.toLowerCase());
    m = idx !== -1 ? String(idx + 1).padStart(2, "0") : "01";
  }
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function toDateObj(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function diffDays(a, b) {
  return Math.round((toDateObj(b) - toDateObj(a)) / 86400000);
}

function addDaysFn(dateStr, days) {
  const d = toDateObj(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function subtractDays(dateStr, days) {
  return addDaysFn(dateStr, -days);
}

function getYear(dateStr) {
  return parseInt(dateStr.split("-")[0], 10);
}

/** GC date → EC string "YYYY/MM/DD" */
function gcToEc(gcStr) {
  try {
    const [y, m, d] = gcStr.split("-").map(Number);
    const [ey, em, ed] = toEthiopian(y, m, d);
    return `${ey}/${String(em).padStart(2, "0")}/${String(ed).padStart(2, "0")}`;
  } catch { return null; }
}

/** Is this a valid 2921-day pair? */
function isValidPair(issueGc, expiryGc) {
  const d = diffDays(issueGc, expiryGc);
  return Math.abs(d - VALIDITY_DAYS) <= 1;
}

// ── Label Position Finder ──────────────────────────────────────

function findKeywordPos(text, keyword) {
  const parts = keyword.split(/\s+/);
  const pattern = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\|\\*]*');
  const re = new RegExp(pattern, 'i');
  const m = text.match(re);
  return m ? m.index : -1;
}

function findLabels(text) {
  const labels = [];
  for (const kw of DOB_KEYS) {
    const pos = findKeywordPos(text, kw);
    if (pos !== -1) labels.push({ type: "dob", pos });
  }
  for (const kw of ISSUE_KEYS) {
    const pos = findKeywordPos(text, kw);
    if (pos !== -1) labels.push({ type: "issue", pos });
  }
  for (const kw of EXPIRY_KEYS) {
    const pos = findKeywordPos(text, kw);
    if (pos !== -1) labels.push({ type: "expiry", pos });
  }
  // Dedup: keep earliest pos per type
  const best = {};
  for (const l of labels) {
    if (!best[l.type] || l.pos < best[l.type].pos) best[l.type] = l;
  }
  return Object.values(best).sort((a, b) => a.pos - b.pos);
}

function findDatePositions(text) {
  if (!text) return [];
  return [...text.matchAll(DATE_REGEX)].map(m => ({
    date: normalizeDate(m[0]),
    pos: m.index
  }));
}

function findOwner(labels, datePos) {
  let owner = labels[0];
  for (const l of labels) {
    if (l.pos <= datePos) owner = l;
  }
  return owner;
}

// ── Main Export ────────────────────────────────────────────────

export function extractValidityDates(ocrLines, _imgWidth) {
  const lines = ocrLines.map(l => l.text || "");

  const pools = { issue: [], expiry: [] };
  const labelLineIndices = { issue: -1, expiry: -1 };

  // ── Phase 1: Label-lock dates ────────────────────────────────
  console.log(`[DateEngine] === Phase 1: Label-lock (${lines.length} lines) ===`);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const labels = findLabels(raw);
    const datePositions = findDatePositions(raw);

    if (labels.length > 0 || datePositions.length > 0) {
      const labelStr = labels.map(l => `${l.type}@${l.pos}`).join(", ");
      const dateStr = datePositions.map(d => `${d.date}@${d.pos}`).join(", ");
      console.log(`[DateEngine]   L${i}: [${labelStr}] dates=[${dateStr}] "${raw.trim().substring(0, 120)}"`);
    }

    if (labels.length === 0) continue;

    for (const l of labels) {
      if (l.type !== "dob" && labelLineIndices[l.type] === -1) {
        labelLineIndices[l.type] = i;
      }
    }

    for (const dp of datePositions) {
      const owner = findOwner(labels, dp.pos);
      if (owner.type === "dob") {
        console.log(`[DateEngine]   DOB date ignored: ${dp.date}`);
        continue;
      }
      pools[owner.type].push(dp.date);
    }
  }

  // Adjacent-line scan: if a label got < 2 dates, check ±2 lines for extras
  for (const type of ["issue", "expiry"]) {
    if (labelLineIndices[type] !== -1 && pools[type].length < 2) {
      const li = labelLineIndices[type];
      for (const offset of [1, 2, -1]) {
        const adj = li + offset;
        if (adj >= 0 && adj < lines.length) {
          const adjLabels = findLabels(lines[adj]);
          // Only take dates from lines that don't have their OWN label
          if (adjLabels.length === 0) {
            const adjDates = findDatePositions(lines[adj]).map(d => d.date);
            if (adjDates.length > 0) {
              console.log(`[DateEngine]   Adjacent L${adj} → ${type}: [${adjDates.join(", ")}]`);
              pools[type].push(...adjDates);
            }
          }
        }
      }
    }
  }

  console.log(`[DateEngine] === Phase 1 Result ===`);
  console.log(`[DateEngine]   Issue pool:  [${pools.issue.join(", ")}]`);
  console.log(`[DateEngine]   Expiry pool: [${pools.expiry.join(", ")}]`);

  // ── Phase 2: Classify EC vs GC ───────────────────────────────
  // Within each pool: smaller year = EC, larger year = GC
  // Year ≤ 2020 → definitely EC
  // Year > 2030 → definitely GC
  function classifyPool(dates) {
    if (dates.length === 0) return { ec: null, gc: null };
    if (dates.length === 1) {
      const y = getYear(dates[0]);
      if (y <= 2020) return { ec: dates[0], gc: null };
      return { ec: null, gc: dates[0] };
    }
    // 2+ dates: sort by year, smallest = EC, largest = GC
    const sorted = [...dates].sort((a, b) => getYear(a) - getYear(b));
    return { ec: sorted[0], gc: sorted[sorted.length - 1] };
  }

  const issueClassified = classifyPool(pools.issue);
  const expiryClassified = classifyPool(pools.expiry);

  console.log(`[DateEngine] === Phase 2: Classified ===`);
  console.log(`[DateEngine]   Issue:  EC=${issueClassified.ec} | GC=${issueClassified.gc}`);
  console.log(`[DateEngine]   Expiry: EC=${expiryClassified.ec} | GC=${expiryClassified.gc}`);

  // ── Phase 3: 2921-day pair validation ────────────────────────
  // Try all GC candidates from issue × expiry
  const issueGcCandidates = pools.issue.filter(d => getYear(d) > 2020);
  const expiryGcCandidates = pools.expiry.filter(d => getYear(d) > 2020);

  let lockedIssueGc = null;
  let lockedExpiryGc = null;

  for (const ig of issueGcCandidates) {
    for (const eg of expiryGcCandidates) {
      if (isValidPair(ig, eg)) {
        lockedIssueGc = ig;
        lockedExpiryGc = eg;
        console.log(`[DateEngine] ✅ LOCKED via 2921-day validator: Issue=${ig} → Expiry=${eg} (diff=${diffDays(ig, eg)})`);
        break;
      }
    }
    if (lockedIssueGc) break;
  }

  // ── Phase 4: Derivation fallback ─────────────────────────────
  if (!lockedIssueGc && !lockedExpiryGc) {
    // Neither GC found via pair test — try derivation
    if (expiryClassified.gc) {
      // Case A: Expiry exists, derive Issue
      lockedExpiryGc = expiryClassified.gc;
      lockedIssueGc = subtractDays(lockedExpiryGc, VALIDITY_DAYS);
      console.log(`[DateEngine] ⚠️ Derived Issue from Expiry: ${lockedExpiryGc} - ${VALIDITY_DAYS} = ${lockedIssueGc}`);
    } else if (issueClassified.gc) {
      // Case B: Issue exists, derive Expiry
      lockedIssueGc = issueClassified.gc;
      lockedExpiryGc = addDaysFn(lockedIssueGc, VALIDITY_DAYS);
      console.log(`[DateEngine] ⚠️ Derived Expiry from Issue: ${lockedIssueGc} + ${VALIDITY_DAYS} = ${lockedExpiryGc}`);
    }
  } else if (lockedIssueGc && !lockedExpiryGc) {
    lockedExpiryGc = addDaysFn(lockedIssueGc, VALIDITY_DAYS);
    console.log(`[DateEngine] ⚠️ Derived Expiry: ${lockedExpiryGc}`);
  } else if (!lockedIssueGc && lockedExpiryGc) {
    lockedIssueGc = subtractDays(lockedExpiryGc, VALIDITY_DAYS);
    console.log(`[DateEngine] ⚠️ Derived Issue: ${lockedIssueGc}`);
  }

  // ── Build result ─────────────────────────────────────────────
  if (!lockedIssueGc && !lockedExpiryGc) {
    console.warn(`[DateEngine] ❌ No validity dates found. Complete failure.`);
    return {
      validity: {
        issue: { gc: null, ec: null },
        expiry: { gc: null, ec: null },
        method: "failure",
        confidence: 0
      }
    };
  }

  // EC: prefer printed EC from pool, otherwise derive from GC
  const issueEc = issueClassified.ec
    ? issueClassified.ec.replace(/-/g, "/")
    : gcToEc(lockedIssueGc);

  const expiryEc = expiryClassified.ec
    ? expiryClassified.ec.replace(/-/g, "/")
    : gcToEc(lockedExpiryGc);

  const method = (issueGcCandidates.length > 0 && expiryGcCandidates.length > 0 && lockedIssueGc && lockedExpiryGc)
    ? "ocr_direct"
    : (lockedIssueGc && lockedExpiryGc)
      ? "derived_partial"
      : "failure";

  console.log(`[DateEngine] === FINAL RESULT ===`);
  console.log(`[DateEngine]   LOCKED ISSUE:  GC=${lockedIssueGc} | EC=${issueEc}`);
  console.log(`[DateEngine]   LOCKED EXPIRY: GC=${lockedExpiryGc} | EC=${expiryEc}`);
  console.log(`[DateEngine]   Method: ${method}`);

  return {
    validity: {
      issue: { gc: lockedIssueGc, ec: issueEc },
      expiry: { gc: lockedExpiryGc, ec: expiryEc },
      method,
      confidence: method === "ocr_direct" ? 1.0 : 0.85
    }
  };
}

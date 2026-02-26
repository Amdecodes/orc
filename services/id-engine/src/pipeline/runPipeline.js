/**
 * runPipeline.js — Orchestrates the three-image extraction pipeline.
 *
 * Accepts Buffer inputs (or file paths for backward compatibility).
 * Merges results from extractFront, extractBack, extractThird into
 * the canonical pipeline result shape expected by generateID and renderCards.
 */

import { extractFront } from '../core/extract/extractFront.js';
import { extractBack }  from '../core/extract/extractBack.js';
import { extractThird } from '../core/extract/extractThird.js';
import { extractValidityDates } from '../core/dates/issueDate.js';

export async function runPipeline(front, back, third) {
    // Run all three extractors in parallel
    const [frontResult, backResult, thirdResult] = await Promise.all([
        extractFront(front),
        extractBack(back),
        extractThird(third),
    ]);

    // ── Personal ──────────────────────────────────────────────────────────────
    // QR (third) is authoritative for English name, DOB, gender
    // Front OCR supplies Amharic name
    const namEn  = thirdResult.personal?.name?.en  || '';
    const namAm  = frontResult.name?.am            || '';
    const dobGc  = thirdResult.personal?.dob?.gc   || frontResult.dob?.gc || '';
    const dobEc  = thirdResult.personal?.dob?.ec   || '';
    const dobSrc = thirdResult.personal?.dob?.source || 'OCR';
    const sexEn  = thirdResult.personal?.gender?.en || '';
    const sexAm  = frontResult.gender?.am           || '';

    // ── Nationality ───────────────────────────────────────────────────────────
    const natAm = backResult.personal?.nationality?.am || '';
    const natEn = backResult.personal?.nationality?.en || '';

    // ── Identifiers ───────────────────────────────────────────────────────────
    const fan = thirdResult.identifiers?.fan || '';
    const fin = backResult.identifiers?.fin  || thirdResult.identifiers?.fin || '';

    // ── Validity / Dates ──────────────────────────────────────────────────────
    // QR gives issue + expiry; back OCR may also supply them.
    // Use extractValidityDates on merged OCR lines as a fallback.
    let validity = thirdResult.validity || { issue: { gc: '', ec: '' }, expiry: { gc: '', ec: '' } };

    if (!validity.issue?.gc && frontResult.ocrLines) {
        try {
            const extracted = extractValidityDates(frontResult.ocrLines);
            if (extracted) {
                validity = extracted;
            }
        } catch (_) { /* ignore */ }
    }

    // Back may have a richer validity block
    if (backResult.validity?.issue?.gc) {
        validity = backResult.validity;
    }

    // ── Contact ───────────────────────────────────────────────────────────────
    const phone   = backResult.contact?.phone   || { value: '', confidence: 0 };
    const address = backResult.contact?.address || { am: '', en: '' };

    // ── Media ─────────────────────────────────────────────────────────────────
    const media = thirdResult.media || {};

    // ── Build canonical pipeline result ───────────────────────────────────────
    return {
        personal: {
            name: { am: namAm, en: namEn },
            gender: {
                am: sexAm,
                en: sexEn,
                confidence: frontResult.gender?.confidence || (sexEn ? 1 : 0),
            },
            nationality: { am: natAm, en: natEn },
            dob: {
                gc:         dobGc,
                ec:         dobEc,
                source:     dobSrc,
                confidence: dobGc ? 1 : 0,
            },
        },
        validity: {
            issue:      validity.issue  || { gc: '', ec: '' },
            expiry:     validity.expiry || { gc: '', ec: '' },
            method:     validity.method || 'none',
            confidence: validity.confidence ?? 0,
        },
        identifiers: { fan, fin },
        contact:     { phone, address },
        media,

        // Expose raw per-extractor results for debugging / downstream consumers
        _raw: {
            front: frontResult,
            back:  backResult,
            third: thirdResult,
        },
    };
}

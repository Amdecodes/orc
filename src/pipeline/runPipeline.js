import { extractFront } from "../extractors/frontExtractor.js";
import { extractBack } from "../extractors/backExtractor.js";
import { extractThird } from "../extractors/thirdExtractor.js";
import { validatePhone } from "../validators/phone.js";
import { validateFIN } from "../validators/fin.js";
import { calculateValidity, gcToEc, formatGcWithMonth } from "../validators/dates.js";
import { calculateCompositionalConfidence } from "../utils/confidence.js";

/**
 * DATA TRUTH HIERARCHY
 * QR > OCR
 */
const FIELD_PRIORITY = {
    name_en: ["third", "front"],
    name_am: ["front", "third"],
    dob: ["third", "front"],
    gender: ["third", "front"],
    fin: ["third", "back"],
    phone: ["back", "third"],
    address: ["back", "third"],
    nationality: ["back", "third"],
    issue_date: ["third", "front", "back"],
    expiry_date: ["third", "front", "back"]
};

/**
 * Main Orchestration Pipeline
 */
export async function runPipeline(frontImg, backImg, thirdImg) {
    console.log("[Pipeline] Starting extraction sequence...");

    // 1. Parallel Extraction
    const [frontRaw, backRaw, thirdRaw] = await Promise.all([
        extractFront(frontImg),
        extractBack(backImg),
        extractThird(thirdImg)
    ]);

    // 2. Passive Merging
    const data = {
        front: frontRaw,
        back: backRaw,
        third: thirdRaw
    };

    // 3. Declarative Conflict Resolution
    const resolved = resolveConflicts(data);

    // 4. Validation & Date Processing
    const phoneVal = validatePhone(resolved.phone);
    const finVal = validateFIN(resolved.fin);
    
    // 4. Deterministic Validity & Date processing
    let finalValidity = {
        issue: { gc: "", ec: "" },
        expiry: { gc: "", ec: "" },
        method: "none"
    };

    // Rule: Use OCR-extracted validity if available (any method except failure)
    const confirmedSource = [data.third.validity, data.front.validity]
        .find(v => v && v.method && v.method !== "failure" && v.method !== "none" && v.issue?.gc);
    
    if (confirmedSource) {
        finalValidity = {
            issue: { 
                gc: formatGcWithMonth(confirmedSource.issue.gc), 
                ec: confirmedSource.issue.ec 
            },
            expiry: { 
                gc: formatGcWithMonth(confirmedSource.expiry.gc), 
                ec: confirmedSource.expiry.ec 
            },
            method: confirmedSource.method
        };
        console.log(`[Pipeline] Using OCR-direct validity (method=${confirmedSource.method})`);
    } else if (resolved.issue_date) {
        // Fallback to calculation ONLY if OCR found nothing
        const calc = calculateValidity(resolved.issue_date);
        finalValidity = {
            ...calc,
            method: "derived_from_issue"
        };
        console.log(`[Pipeline] Falling back to derived validity from issue_date`);
    }

    // Process DOB (QR > Front) + EC Conversion
    let finalDobGc = resolved.dob;
    if (finalDobGc) finalDobGc = finalDobGc.replace(/\//g, "-");
    const finalDobEc = gcToEc(finalDobGc);

    // 5. Confidence Scoring
    const confidence = calculateCompositionalConfidence({
        qrDecoded: !!thirdRaw.qr_payload?.raw,
        finValid: finVal.valid,
        phoneValid: phoneVal.valid,
        datesValid: !!finalValidity.issue.gc
    });

    // 6. Final Transformation (Immutable JSON Contract)
    return {
        personal: {
            name: { 
                am: resolved.name_am, 
                en: resolved.name_en 
            },
            gender: { 
                am: resolved.gender === "Male" ? "ወንድ" : (resolved.gender === "Female" ? "ሴት" : ""),
                en: resolved.gender, 
                confidence: 1 
            },
            nationality: { 
                am: resolved.nationality_am, 
                en: resolved.nationality_en 
            },
            dob: {
                gc: formatGcWithMonth(finalDobGc),
                ec: finalDobEc,
                source: resolved.dob_source,
                confidence: 1
            }
        },
        validity: {
            issue: finalValidity.issue,
            expiry: finalValidity.expiry,
            method: finalValidity.method,
            confidence: finalValidity.method === "anchored_dual_date_confirmed" ? 1.0 : 0.8
        },
        identifiers: {
            fan: thirdRaw.identifiers.fan,
            fin: finVal.value || resolved.fin
        },
        contact: {
            phone: { 
                value: phoneVal.value || resolved.phone, 
                confidence: 1 
            },
            address: { 
                am: resolved.address_am, 
                en: resolved.address_en 
            }
        },
        media: {
            portrait: thirdRaw.media.portrait,
            qr: thirdRaw.media.qr,
            barcode: thirdRaw.media.barcode
        },
        qr_payload: thirdRaw.qr_payload,
        system: {
            version: "1.0.1",
            pipeline: "deterministic_v1_dates"
        },
        _confidence: confidence
    };
}

function resolveConflicts(data) {
    const resolved = {};

    // Helper: Pick value based on priority
    const pick = (field, mapping) => {
        for (const source of FIELD_PRIORITY[field]) {
            const val = mapping[source];
            if (val && val !== "") return { value: val, source };
        }
        return { value: "", source: "none" };
    };

    resolved.name_en = pick("name_en", { 
        third: data.third.personal.name.en, 
        front: data.front.name.en 
    }).value;

    resolved.name_am = pick("name_am", { 
        front: data.front.name.am, 
        third: "" 
    }).value;

    const dobPick = pick("dob", { 
        third: data.third.personal.dob.gc, 
        front: data.front.dob.gc 
    });
    resolved.dob = dobPick.value;
    resolved.dob_source = dobPick.source === "third" ? "QR" : "OCR";

    resolved.gender = pick("gender", { 
        third: data.third.personal.gender.en, 
        front: data.front.gender.en 
    }).value;

    resolved.fin = pick("fin", { 
        third: data.third.identifiers.fin, 
        back: data.back.identifiers.fin 
    }).value;

    resolved.phone = pick("phone", { 
        back: data.back.contact.phone.value, 
        third: "" 
    }).value;
    
    resolved.address_en = pick("address", { 
        back: data.back.contact.address.en, 
        third: "" 
    }).value;

    resolved.address_am = pick("address", { 
        back: data.back.contact.address.am, 
        third: "" 
    }).value;
    
    resolved.nationality_en = pick("nationality", { 
        back: data.back.personal.nationality.en, 
        third: "" 
    }).value;

    resolved.nationality_am = pick("nationality", { 
        back: data.back.personal.nationality.am, 
        third: "" 
    }).value;

    // --- Validity Logic (Strict 2921-day rule) ---
    resolved.issue_date = pick("issue_date", { 
        third: data.third.validity.issue.gc, 
        front: data.front.validity.issue.gc,
        back: data.back.validity?.issue?.gc || "" 
    }).value;

    console.log(`[Pipeline] Final Issue Date Found: ${resolved.issue_date}`);

    return resolved;
}

// --- CLI Wrapper ---
if (process.argv[1] && process.argv[1].endsWith("runPipeline.js")) {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log("Usage: node runPipeline.js <front> <back> <third>");
        process.exit(1);
    }

    runPipeline(args[0], args[1], args[2])
        .then(res => {
            console.log(JSON.stringify(res, null, 2));
        })
        .catch(err => {
            console.error("Pipeline Failed:", err);
            process.exit(1);
        });
}


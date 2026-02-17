/**
 * BACK SIDE EXTRACTOR
 * 
 * Logic copied verbatim from ground-truth source: ocr/back_scan.js
 * No renaming of internal variables.
 * No regex changes.
 * No OCR parameter changes.
 */

import { extractBackID } from "../utils/back_engine.js";

export async function extractBack(imagePath) {
    console.log(`[Extractor:Back] Processing ${imagePath}`);
    
    // Wrapping existing logic as requested.
    const result = await extractBackID(imagePath);
    
    return {
        identifiers: {
            fin: result.fin || ""
        },
        contact: {
            phone: { value: result.phone || "", confidence: result._confidence?.phone || 0 },
            address: {
                am: result.address?.normalized_am || result.address?.raw || "",
                en: result.address?.normalized || ""
            }
        },
        personal: {
            nationality: {
                am: result.nationality?.am || "",
                en: result.nationality?.value || ""
            }
        },
        validity: {
            issue: result.validity?.validity?.issue || { gc: "", ec: "" },
            expiry: result.validity?.validity?.expiry || { gc: "", ec: "" }
        },
        _raw: result
    };
}

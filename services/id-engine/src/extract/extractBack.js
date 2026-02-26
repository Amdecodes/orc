/**
 * BACK SIDE EXTRACTOR
 *
 * Accepts: imagePath (string) OR imageBuffer (Buffer)
 *
 * Logic delegated verbatim to back_engine. No regex changes.
 */

import { extractBackID } from "../../utils/back_engine.js";

export async function extractBack(input) {
    const label = Buffer.isBuffer(input) ? '<buffer>' : input;
    console.log(`[Extractor:Back] Processing ${label}`);

    // Wrapping existing logic — back_engine now accepts Buffer | string
    const result = await extractBackID(input);

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
            issue:  result.validity?.validity?.issue  || { gc: "", ec: "" },
            expiry: result.validity?.validity?.expiry || { gc: "", ec: "" }
        },
        _raw: result
    };
}

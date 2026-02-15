import sharp from "sharp";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const { MultiFormatReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, DecodeHintType } = require("@zxing/library");
const jsQR = require("jsqr");

/**
 * Scans an image for a QR code and returns parsed data.
 * @param {string} imagePath - Path to the image file.
 * @returns {Promise<Object|null>} - Parsed data or null if no QR found/error.
 */
export async function scanQR(imagePath) {
  try {
    const pipeline = sharp(imagePath);
    const meta = await pipeline.metadata();
    
    // 1. Try ZXing Multi-format (Highly robust)
    let result = await decodeWithZXing(pipeline);
    if (result) return result;

    // 2. Try 2x Upscale + Threshold + ZXing
    const upscaled = sharp(imagePath)
        .resize(meta.width * 2)
        .grayscale()
        .threshold(128); 
    
    result = await decodeWithZXing(upscaled);
    if (result) return result;

    // 3. Last Resort: jsQR on raw
    result = await decodeWithJsQR(pipeline);
    if (result) return result;

    return null;
  } catch (e) {
    if (e.message && e.message.includes("ENOENT")) {
        console.error(`File not found: ${imagePath}`);
    } else {
        console.error("QR Scan Error:", e);
    }
    return null;
  }
}

/**
 * Helper to decode using ZXing
 */
async function decodeWithZXing(pipeline) {
    try {
        const { data, info } = await pipeline
            .removeAlpha() 
            .raw()
            .toBuffer({ resolveWithObject: true });

        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new MultiFormatReader();
        reader.setHints(hints);

        const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height);
        const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

        const decodeResult = reader.decode(binaryBitmap);
        if (decodeResult) {
            return parseQRData(decodeResult.getText());
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Helper to decode using jsQR
 */
async function decodeWithJsQR(pipeline) {
    try {
        const { data, info } = await pipeline
            .ensureAlpha() 
            .raw()
            .toBuffer({ resolveWithObject: true });

        const code = jsQR(data, info.width, info.height);
        if (code && code.data) {
            return parseQRData(code.data);
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Parses the raw QR string into structured data.
 * Handles JSON or the specific Fayda delimited format.
 */
function parseQRData(rawData) {
    if (!rawData) return null;

    // 1. Try JSON
    try {
        const json = JSON.parse(rawData);
        return normalizeQR(json);
    } catch (e) {}

    // 2. Fayda Delimited Format
    if (rawData.includes(':')) {
        const parts = rawData.split(':');
        const data = { _source: "QR_Delimited" };

        const tags = {
            "G": "gender",
            "D": "dob",
            "N": "nationality",
            "A": "address_tag" 
        };

        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];

            // Handle tags
            if (tags[p] && parts[i+1]) {
                data[tags[p]] = parts[i+1];
            }

            // Special: Look for Name after DLT
            if (p === "DLT" && parts[i+1]) {
                data.name = parts[i+1];
            }

            // Experimental: Try decoding as Base64 to find address/nationality
            if (p.length > 32 && /^[A-Za-z0-9+/=]+$/.test(p)) {
                try {
                    const buf = Buffer.from(p, 'base64');
                    // Check if it's UTF8 readable (at least 50% printable ASCII)
                    const decoded = buf.toString('utf8');
                    let printable = 0;
                    for (let j = 0; j < Math.min(decoded.length, 100); j++) {
                        const code = decoded.charCodeAt(j);
                        if (code >= 32 && code <= 126) printable++;
                    }
                    
                    if (printable > 50 || decoded.includes("Region") || decoded.includes("ክልል")) {
                        // Look for keywords
                        const regionMatch = decoded.match(/Region:?\s*([^,|:\n]+)/i) || decoded.match(/ክልል:?\s*([^,|:\n]+)/);
                        if (regionMatch) data.region = regionMatch[1].trim();
                        
                        const zoneMatch = decoded.match(/Zone:?\s*([^,|:\n]+)/i) || decoded.match(/ዞን:?\s*([^,|:\n]+)/);
                        if (zoneMatch) data.zone = zoneMatch[1].trim();
                        
                        const woredaMatch = decoded.match(/Woreda:?\s*([^,|:\n]+)/i) || decoded.match(/ወረዳ:?\s*([^,|:\n]+)/);
                        if (woredaMatch) data.woreda = woredaMatch[1].trim();
                        
                        const natMatch = decoded.match(/Nationality:?\s*([^,|:\n]+)/i);
                        if (natMatch) data.nationality = natMatch[1].trim();
                    }
                } catch (e) {}
            }
        }

        // Find Primary IDs (12 or 16 digits)
        const numbers = parts.filter(p => /^\d{12,16}$/.test(p));
        for (const num of numbers) {
            if (num.length === 12) data.uin = num;
            if (num.length === 16) data.vid = num;
            if (!data.fin) data.fin = num; 
        }

        return normalizeQR(data);
    }

    return { raw: rawData };
}

/**
 * Normalizes QR JSON keys to our standard schema
 */
function normalizeQR(data) {
    const raw = data || {};
    
    const result = {
        fin: raw.fin || raw.FIN || raw.idNumber || raw.uin || raw.vid || null,
        uin: raw.uin || (raw.fin && String(raw.fin).length === 12 ? raw.fin : null),
        vid: raw.vid || (raw.fin && String(raw.fin).length === 16 ? raw.fin : null),
        phone: raw.phone || raw.PHONE || raw.mobile || null,
        name: raw.name || raw.NAME || raw.fullName || null,
        gender: raw.gender === "M" ? "Male" : (raw.gender === "F" ? "Female" : (raw.gender || null)),
        nationality: { value: raw.nationality || raw.NATIONALITY || null, raw: raw.nationality || null },
        address: null,
        dob: raw.dob || raw.birthDate || null,
        issueDate: raw.issueDate || null,
        expiryDate: raw.expiryDate || null,
        _source: "QR"
    };

    // Address construction from QR fields
    if (raw.address || raw.region || raw.zone || raw.woreda) {
        if (typeof raw.address === 'string') {
            result.address = { raw: raw.address, region: null };
        } else {
             const addrObj = raw.address || {};
             result.address = {
                region: raw.region || addrObj.region || addrObj.REGION || raw.Region || null,
                zone: raw.zone || addrObj.zone || addrObj.ZONE || raw.Zone || null,
                woreda: raw.woreda || addrObj.woreda || addrObj.WOREDA || raw.Woreda || null,
                kebele: addrObj.kebele || addrObj.KEBELE || raw.Kebele || null,
                houseNumber: addrObj.houseNumber || addrObj.house_number || null,
                raw: [raw.region || addrObj.region, raw.zone || addrObj.zone, raw.woreda || addrObj.woreda].filter(Boolean).join(", ")
             };
        }
    }

    if (result.phone) {
        let p = String(result.phone).replace(/\D/g, '');
        if (p.startsWith('251')) p = '0' + p.substring(3);
        if (p.length === 9) p = '0' + p; 
        result.phone = p;
    }

    if (result.fin) {
         result.fin = String(result.fin).replace(/\D/g, '');
    }

    return result;
}

/**
 * THIRD IMAGE EXTRACTOR (QR + Portrait + Dates)
 * 
 * Logic copied verbatim where applicable.
 */

import fs from "fs/promises";
import sharp from "sharp";
import { scanQR } from "../utils/qr_engine.js";
import { extractPortrait } from "../utils/portrait_cropper.js";
import { generateBarcode } from "../utils/barcode_generator.js";
import { groupWordsIntoLines } from "../utils/ocr_utils.js";
import { extractValidityDates } from "../utils/date_engine.js";
import { runTesseractCLI, parseTSV } from "../utils/cli_ocr.js";
import path from "path";
import os from "os";

export async function extractThird(imagePath) {
    console.log(`[Extractor:Third] Processing ${imagePath}`);
    
    // 1. QR Scan (Authoritative for English name, DOB, IDs)
    const qrData = await scanQR(imagePath);
    
    // 2. Portrait Extraction (Top 58% + Background Removal)
    const imgBuffer = await fs.readFile(imagePath);
    const portraitBuffer = await extractPortrait(imgBuffer);
    
    // 2.1 QR Image Extraction (Lossless crop with padding)
    let qrImageBase64 = null;
    if (qrData?._bbox) {
        const { width: imgWidth, height: imgHeight } = await sharp(imgBuffer).metadata();
        const { left, top, width, height } = qrData._bbox;

        // Expand by 15% for quiet zone
        const padding = Math.max(width, height) * 0.15;
        const cropX = Math.max(0, Math.floor(left - padding));
        const cropY = Math.max(0, Math.floor(top - padding));
        const cropW = Math.min(imgWidth - cropX, Math.ceil(width + padding * 2));
        const cropH = Math.min(imgHeight - cropY, Math.ceil(height + padding * 2));

        if (cropW > 0 && cropH > 0) {
            const qrBuffer = await sharp(imgBuffer)
                .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
                .png({ compressionLevel: 0 }) // Lossless
                .toBuffer();
            qrImageBase64 = qrBuffer.toString('base64');
        } else {
            console.warn(`[Extractor:Third] Invalid QR crop dimensions: ${cropW}x${cropH}`);
        }
    }

    // 2.2 Barcode Image Generation (1D from FAN)
    let barcodeImageBase64 = null;
    if (qrData?.vid) {
        const barcodeBuffer = await generateBarcode(qrData.vid);
        if (barcodeBuffer) {
            barcodeImageBase64 = barcodeBuffer.toString('base64');
        }
    }

    // 3. Validity (Minimal QR fallback)
    const validity = {
        issue: { 
            gc: qrData?.issueDate || "",
            ec: ""
        },
        expiry: { 
            gc: qrData?.expiryDate || "",
            ec: ""
        },
        method: qrData?.issueDate ? "QR" : "none",
        confidence: qrData?.issueDate ? 1.0 : 0
    };

    return {
        personal: {
            name: { en: qrData?.name || "" },
            dob: {
                gc: qrData?.dob || "",
                ec: "",
                source: qrData ? "QR" : "OCR"
            },
            gender: {
                en: qrData?.gender || ""
            }
        },
        validity,
        identifiers: {
            fan: qrData?.vid || "",
            fin: qrData?.uin || ""
        },
        media: {
            portrait: {
                png: portraitBuffer ? portraitBuffer.toString('base64') : null,
                confidence: portraitBuffer ? 1 : 0,
                source: "third"
            },
            qr: {
                png: qrImageBase64,
                format: "png",
                source: "crop",
                confidence: qrImageBase64 ? 1.0 : 0
            },
            barcode: {
                png: barcodeImageBase64,
                format: "png",
                source: "generated",
                confidence: barcodeImageBase64 ? 1.0 : 0
            }
        },
        qr_payload: {
            raw: qrData?._raw || null,
            parsed: qrData || {},
            confidence: qrData ? 1.0 : 0
        },
        _raw: { qr: qrData }
    };
}

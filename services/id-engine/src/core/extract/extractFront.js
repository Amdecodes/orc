/**
 * FRONT SIDE EXTRACTOR (Hardened)
 *
 * Accepts: imagePath (string) OR imageBuffer (Buffer)
 *
 * Rules:
 * 1. Fixed positional crop (35-60% Y).
 * 2. Multi-pass OCR (Standard, Threshold 128, Threshold 160).
 * 3. Line-by-line search for best Amharic name candidate.
 * 4. Strict script & rule-based validation.
 */

import { createWorker } from "tesseract.js";
import { getFrontNameCrop, getFrontDobCrop } from "../../utils/crop.js";
import { findBestNameCandidate } from "../../utils/name_validator.js";
import { groupWordsIntoLines } from "../../utils/ocr_utils.js";
import { extractValidityDates } from "../dates/issueDate.js";
import { runTesseractCLI, parseTSV } from "../../utils/cli_ocr.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function extractFront(input) {
    const imageBuffer = Buffer.isBuffer(input)
        ? input
        : await fs.readFile(input);

    const label = Buffer.isBuffer(input) ? '<buffer>' : input;
    console.log(`[Extractor:Front] Hardened Extraction for ${label}`);

    const meta = await sharp(imageBuffer).metadata();
    const nameCrop = getFrontNameCrop(meta);
    const dobCrop = getFrontDobCrop(meta);

    const workerAmh = await createWorker("amh");
    const workerEng = await createWorker("eng");

    const candidates = [];
    let dobGc = "";

    try {
        const nameCroppedBuffer = await sharp(imageBuffer).extract(nameCrop).toBuffer();

        // --- Pass 1-3: Amharic Name Scanning ---
        // Pass 1: Standard Grayscale
        const pass1Buf = await sharp(nameCroppedBuffer).grayscale().png().toBuffer();
        const { data: { text: text1 } } = await workerAmh.recognize(pass1Buf);
        const best1 = findBestNameCandidate(text1);
        if (best1) candidates.push(best1);

        // Pass 2: Threshold 128
        const pass2Buf = await sharp(nameCroppedBuffer).grayscale().threshold(128).png().toBuffer();
        const { data: { text: text2 } } = await workerAmh.recognize(pass2Buf);
        const best2 = findBestNameCandidate(text2);
        if (best2) candidates.push(best2);

        // Pass 3: Threshold 160
        const pass3Buf = await sharp(nameCroppedBuffer).grayscale().threshold(160).png().toBuffer();
        const { data: { text: text3 } } = await workerAmh.recognize(pass3Buf);
        const best3 = findBestNameCandidate(text3);
        if (best3) candidates.push(best3);

        // --- Pass 4: DOB Fallback (English Worker) ---
        const dobCroppedBuffer = await sharp(imageBuffer).extract(dobCrop).toBuffer();
        const { data: { text: dobText } } = await workerEng.recognize(dobCroppedBuffer);

        // Strict GC Date Regex (YYYY/MM/DD)
        const dateMatch = dobText.match(/\b(19|20)\d{2}[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])\b/);
        if (dateMatch) {
            dobGc = dateMatch[0].replace(/\//g, "-");
        }

    } finally {
        await workerAmh.terminate();
        await workerEng.terminate();
    }

    // --- Pass 5: Global OCR (Returned for Pipeline Validity Search) ---
    let ocrLines = [];
    const tempPath = path.join(os.tmpdir(), `front_ocr_lines_${Date.now()}.png`);
    try {
        await fs.writeFile(tempPath, imageBuffer);
        const tsv = runTesseractCLI(tempPath, 'tsv', { psm: 3 });
        const words = parseTSV(tsv);
        ocrLines = groupWordsIntoLines(words);
    } catch (err) {
        console.warn(`[Extractor:Front] Global OCR failed: ${err.message}`);
    } finally {
        await fs.unlink(tempPath).catch(() => {});
    }

    const bestOverall = candidates.sort((a, b) => b.score - a.score)[0];

    return {
        name: {
            am: bestOverall ? bestOverall.clean : "",
            en: ""
        },
        dob: {
            gc: dobGc
        },
        gender: {
            am: "",
            en: "",
            confidence: bestOverall ? 0.95 : 0
        },
        ocrLines, // Expose for centralized date extraction
        _raw: { candidates, dobText: dobGc }
    };
}

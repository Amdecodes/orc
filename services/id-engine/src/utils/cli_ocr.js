import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Runs Tesseract CLI and returns results.
 * @param {string} imagePath - Path to input image.
 * @param {string} outputFormat - 'txt', 'tsv', 'hocr'.
 * @param {Object} options - Tesseract config options.
 */
export function runTesseractCLI(imagePath, outputFormat = 'txt', config = {}) {
    const tempPrefix = `/tmp/tess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const outputBase = tempPrefix;
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const PROJECT_ROOT = path.resolve(__dirname, '../../../../tessdata');
    
    // Tesseract CLI syntax: tesseract imagefile outputbase [options...] [configfile...]
    // Options (--tessdata-dir, -l, --psm, -c) come before configfiles (tsv, hocr)
    const args = [imagePath, outputBase];
    
    // Add tessdata directory
    args.push('--tessdata-dir', PROJECT_ROOT);

    // Add language
    if (config.lang) {
        args.push('-l', config.lang);
    } else {
        args.push('-l', 'amh+eng');
    }

    // Add PSM
    if (config.psm) args.push('--psm', String(config.psm));
    
    // Add OEM (0=Legacy, 1=LSTM, 2=Legacy+LSTM, 3=Default)
    if (config.oem !== undefined) args.push('--oem', String(config.oem));
    
    // Add parameters (whitelist, etc)
    if (config.params) {
        for (const [k, v] of Object.entries(config.params)) {
            args.push('-c', `${k}=${v}`);
        }
    }

    // Add format LAST (configfiles must be the last arguments)
    if (outputFormat === 'tsv') args.push('tsv');
    else if (outputFormat === 'hocr') args.push('hocr');

    console.log(`[TesseractCLI] Executing: tesseract ${args.join(' ')}`);

    try {
        execFileSync('tesseract', args, { stdio: 'pipe' });
        
        let resultPath = outputBase;
        if (outputFormat === 'tsv') resultPath += '.tsv';
        else if (outputFormat === 'hocr') resultPath += '.hocr';
        else resultPath += '.txt';

        const data = fs.readFileSync(resultPath, 'utf8');
        
        // Cleanup
        if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
        
        return data;
    } catch (e) {
        console.error(`Tesseract CLI Error: ${e.message}`);
        return null;
    }
}

/**
 * Parses Tesseract TSV output into a structured array.
 */
export function parseTSV(tsvText) {
    if (!tsvText) return [];
    const lines = tsvText.trim().split('\n');
    const header = lines[0].split('\t');
    const results = [];

    const col = {
        level: header.indexOf('level'),
        page_num: header.indexOf('page_num'),
        block_num: header.indexOf('block_num'),
        par_num: header.indexOf('par_num'),
        line_num: header.indexOf('line_num'),
        word_num: header.indexOf('word_num'),
        left: header.indexOf('left'),
        top: header.indexOf('top'),
        width: header.indexOf('width'),
        height: header.indexOf('height'),
        conf: header.indexOf('conf'),
        text: header.indexOf('text')
    };

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split('\t');
        if (row.length < header.length) continue;

        results.push({
            level: parseInt(row[col.level]),
            page_num: parseInt(row[col.page_num]),
            block_num: parseInt(row[col.block_num]),
            par_num: parseInt(row[col.par_num]),
            line_num: parseInt(row[col.line_num]),
            word_num: parseInt(row[col.word_num]),
            bbox: {
                x0: parseInt(row[col.left]),
                y0: parseInt(row[col.top]),
                x1: parseInt(row[col.left]) + parseInt(row[col.width]),
                y1: parseInt(row[col.top]) + parseInt(row[col.height]),
                w: parseInt(row[col.width]),
                h: parseInt(row[col.height])
            },
            confidence: parseFloat(row[col.conf]),
            text: row[col.text] || ""
        });
    }

    return results;
}

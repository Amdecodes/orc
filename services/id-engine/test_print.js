import { renderPrintReady } from './src/core/image/composePrint.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const frontBg  = path.join(ROOT, 'output', 'id-export-front.png');
const backBg   = path.join(ROOT, 'output', 'id-export-back.png');
const outPath   = path.join(ROOT, 'output', 'print-ready.png');

(async () => {
    try {
        await renderPrintReady(frontBg, backBg, outPath);
        console.log('Successfully generated print composite.');
        process.exit(0);
    } catch (e) {
        console.error('Error generating print layout:', e);
        process.exit(1);
    }
})();

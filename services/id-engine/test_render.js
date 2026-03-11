import { renderFront, renderBack } from './src/core/image/renderCards.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const jsonPath = path.join(ROOT, '..', '..', 'verification_result.json');
const frontBg  = path.join(ROOT, 'front_V6.0.png');
const backBg   = path.join(ROOT, 'back_v6.0.png');
const outDir   = path.join(ROOT, 'output');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

(async () => {
    try {
        await renderFront(data, frontBg, path.join(outDir, 'id-export-front.png'));
        await renderBack (data, backBg,  path.join(outDir, 'id-export-back.png'));
        console.log('Successfully generated images.');
        process.exit(0);
    } catch (e) {
        console.error('Error generating:', e);
        process.exit(1);
    }
})();

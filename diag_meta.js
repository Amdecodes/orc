import fs from 'fs';
import { getImageDimensions } from './ocr/image_meta.js';

async function test() {
    const files = [
        './samples/front/image.png',
        './samples/front/tariku.png',
        './samples/front/1st.jpg',
        './samples/front/tariku.jpg'
    ];

    for (const f of files) {
        console.log(`Checking ${f}...`);
        if (fs.existsSync(f)) {
            try {
                const dims = await getImageDimensions(f);
                console.log(`✅ ${f}: ${dims.width}x${dims.height}`);
            } catch (e) {
                console.log(`❌ ${f}: Error getting dimensions: ${e.message}`);
            }
        } else {
            console.log(`❌ ${f}: File not found`);
        }
    }
}

test();

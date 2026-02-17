import { processThirdScreenshot } from "./ocr/qr_face_worker.js";
import fs from "fs";
import path from "path";

async function runTest() {
    const imagePath = process.argv[2];
    if (!imagePath) {
        console.error("Usage: node test_qr_face_real.js <path/to/image.png>");
        process.exit(1);
    }

    try {
        console.log(`Processing: ${imagePath}`);
        const buffer = fs.readFileSync(imagePath);
        
        const start = Date.now();
        const result = await processThirdScreenshot(buffer);
        const duration = Date.now() - start;

        console.log(`\n✅ Completed in ${duration}ms`);
        console.log("---------------------------------------------------");
        console.log(JSON.stringify(result.qr, null, 2));
        console.log("---------------------------------------------------");
        console.log(`Confidence: ${result._confidence}`);
        console.log(`Photo Size: ${result.photo_png.length} bytes (base64)`);
        console.log(`Barcode Size: ${result.barcode_png ? result.barcode_png.length : 0} bytes (base64)`);

        // Save outputs
        const baseName = path.basename(imagePath, path.extname(imagePath));
        const outDir = "output";
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

        fs.writeFileSync(path.join(outDir, `${baseName}_face.png`), Buffer.from(result.photo_png, 'base64'));
        if (result.barcode_png) {
            fs.writeFileSync(path.join(outDir, `${baseName}_barcode.png`), Buffer.from(result.barcode_png, 'base64'));
        }
        
        console.log(`\noutputs saved to ${outDir}/:`);
        console.log(`- ${baseName}_face.png`);
        console.log(`- ${baseName}_barcode.png`);

    } catch (e) {
        console.error("❌ Error processing image:", e);
    }
}

runTest();

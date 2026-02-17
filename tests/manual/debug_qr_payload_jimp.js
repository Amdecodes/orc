import Jimp from "jimp";
import jsQR from "jsqr";
import fs from "fs";

async function run() {
    const file = "samples/qr/photo_1_2026-02-16_09-45-11.jpg";
    console.log("Reading file:", file);
    
    const image = await Jimp.read(file);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    console.log(`Image Size: ${width}x${height}`);
    
    const code = jsQR(
        image.bitmap.data,
        width,
        height
    );

    if (code) {
        console.log("\n✅ QR FOUND:");
        fs.writeFileSync("debug_qr_jimp_output.txt", code.data);
        console.log("Wrote debug_qr_jimp_output.txt");
    } else {
        console.log("❌ No QR found (Jimp).");
    }
}

run();

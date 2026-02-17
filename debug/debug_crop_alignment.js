import sharp from "sharp";
import { cropRelative, CROP_CONFIG } from "../src/crop_utils.js";
import fs from "fs";

const SAMPLE_PATH = "samples/qr/photo_1_2026-02-16_09-45-11.jpg";

async function debugCrops() {
    console.log(`Inspecting ${SAMPLE_PATH}...`);
    const buffer = fs.readFileSync(SAMPLE_PATH);
    
    // Check dimensions
    const meta = await sharp(buffer).metadata();
    console.log(`Image Dimensions: ${meta.width} x ${meta.height}`);

    // Perform Crops
    const photoBuffer = await cropRelative(buffer, CROP_CONFIG.photo);
    const qrBuffer = await cropRelative(buffer, CROP_CONFIG.qr);

    // Save for visual inspection
    fs.writeFileSync("output/debug_crop_photo.png", photoBuffer);
    fs.writeFileSync("output/debug_crop_qr.png", qrBuffer);

    console.log("Saved debug crops to output/debug_crop_photo.png and output/debug_crop_qr.png");
}

debugCrops();

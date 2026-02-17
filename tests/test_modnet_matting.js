import { removeBackground } from "../src/matting_engine.js";
import fs from "fs";
import path from "path";

const INPUT_IMAGE = "./output/face_test/crop_photo_1_2026-02-16_09-45-11.jpg";
const OUTPUT_IMAGE = "./output/face_test/modnet_matting_test.png";

async function testMatting() {
    console.log("Starting MODNet matting test...");
    if (!fs.existsSync(INPUT_IMAGE)) {
        console.error("Input image not found:", INPUT_IMAGE);
        return;
    }

    try {
        const buffer = fs.readFileSync(INPUT_IMAGE);
        console.log("Calling removeBackground (MODNet)...");
        const result = await removeBackground(buffer);
        
        console.log("Matting complete. Shirt Confidence:", result.shirtConfidence);
        fs.writeFileSync(OUTPUT_IMAGE, result.buffer);
        console.log("Saved output to", OUTPUT_IMAGE);
    } catch (e) {
        console.error("Matting failed:", e);
    }
}

testMatting();

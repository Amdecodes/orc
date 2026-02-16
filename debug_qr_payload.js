import { findLayoutAnchor } from "./ocr/layout_anchor.js";
import fs from "fs";

async function run() {
    const file = "samples/qr/photo_1_2026-02-16_09-45-11.jpg";
    console.log("Reading file:", file);
    const buffer = fs.readFileSync(file);
    
    console.log("Scanning...");
    const anchor = await findLayoutAnchor(buffer);
    
    if (anchor && anchor.type === 'QR') {
        console.log("\n✅ QR FOUND:");
        console.log("--------------------------------------------------");
        console.log(anchor.raw.data);
        console.log("--------------------------------------------------");
    } else {
        console.log("❌ No QR found or Anchor failed.");
    }
}

run();

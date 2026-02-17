import { findLayoutAnchor } from "../src/layout_anchor.js";
import fs from "fs";

async function run() {
    try {
        const file = "samples/qr/photo_1_2026-02-16_09-45-11.jpg";
        const buffer = fs.readFileSync(file);
        
        console.log("Scanning...");
        const anchor = await findLayoutAnchor(buffer);
        
        if (anchor && anchor.type === 'QR') {
            fs.writeFileSync("debug_qr_raw.txt", anchor.raw.data);
            console.log("Wrote debug_qr_raw.txt");
        } else {
            console.log("No QR found.");
        }
    } catch (e) {
        console.error(e);
    }
}

run();

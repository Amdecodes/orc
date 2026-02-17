import { processThirdScreenshot } from "./ocr/qr_face_worker.js";
import fs from "fs";

async function run() {
    try {
        const file = "samples/qr/photo_1_2026-02-16_09-45-11.jpg";
        console.log("Processing:", file);
        const buffer = fs.readFileSync(file);
        
        const result = await processThirdScreenshot(buffer);
        
        console.log("\n✅ Result:");
        console.log(JSON.stringify(result.qr, null, 2));
        
        fs.writeFileSync("verify_output.json", JSON.stringify(result, null, 2));
        console.log("\nWrote verify_output.json");
        
    } catch (e) {
        console.error("Error:", e);
    }
}

run();

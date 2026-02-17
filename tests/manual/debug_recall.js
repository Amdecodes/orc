import { extractBackID } from "./ocr/back_scan.js";
import fs from "fs";

async function debugRecall() {
    const img = "samples/back/image copy 2.png";
    console.log(`--- DEBUG RECALL: ${img} ---`);
    
    // We expect to see SafeMode logs in stdout
    const result = await extractBackID(img);
    
    console.log("\nFINAL RESULT:");
    console.log(JSON.stringify(result, null, 2));
}

debugRecall().catch(console.error);

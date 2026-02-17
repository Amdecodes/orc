import { extractBackID } from "./ocr/back_scan.js";
import path from "path";

async function debug() {
    const img = "image copy 7.png";
    const imagePath = path.join("./samples/back", img);
    console.log(`--- Debugging Recovery: ${img} ---`);
    const results = await extractBackID(imagePath);
    console.log(JSON.stringify(results, null, 2));
}

debug();

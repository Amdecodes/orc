import { extractBackID } from "../src/back_scan.js";
import path from "path";

async function debug() {
    const img = "image copy 7.png";
    const imagePath = path.join("../assets/samples/back", img);
    console.log(`--- Debugging Recovery: ${img} ---`);
    const results = await extractBackID(imagePath);
    console.log(JSON.stringify(results, null, 2));
}

debug();

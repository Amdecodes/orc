import { extractBackID } from "../src/back_scan.js";
import fs from "fs";

try {
    const img = "samples/back/image copy 7.png"; 
    console.log(`Debugging ${img}...`);
    const result = await extractBackID(img);
    console.log("RESULT:", JSON.stringify(result, null, 2));
} catch (e) {
    console.error("DEBUG ERROR:", e);
}

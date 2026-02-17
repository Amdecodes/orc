import { extractBackID } from "../src/back_scan.js";
import path from "path";

async function testFull() {
    const imagePath = path.resolve("qr.jpg");
    console.log(`Running full extraction on: ${imagePath}`);
    const result = await extractBackID(imagePath);
    console.log("RESULT:", JSON.stringify(result, null, 2));
}

testFull();

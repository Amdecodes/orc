import fs from "fs";
import { extractFront } from "./src/core/extract/extractFront.js";
import { extractValidityDates } from "./src/core/dates/issueDate.js";

async function run() {
    const frontRes = await extractFront("../../assets/samples/front/image.png");
    console.log("OCR Lines Extracted:", frontRes.ocrLines.length);
    const dates = extractValidityDates(frontRes.ocrLines, frontRes.imgWidth);
    console.log("Dates Result:", JSON.stringify(dates, null, 2));
}

run();

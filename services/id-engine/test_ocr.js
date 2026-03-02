import fs from "fs";
import { extractFront } from "./src/core/extract/extractFront.js";

async function run() {
    const res = await extractFront("../../front_V5.0.png");
    console.log(JSON.stringify(res.ocrLines, null, 2));
}

run();

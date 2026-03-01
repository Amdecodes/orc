import fs from "fs";
import { extractFront } from "./src/core/extract/extractFront.js";

async function run() {
    const res = await extractFront("../../assets/samples/front/image.png");
    console.log(JSON.stringify(res.ocrLines, null, 2));
}

run();

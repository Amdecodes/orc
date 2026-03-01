import fs from "fs";
import { extractValidityDates } from "./src/core/dates/issueDate.js";

const json = JSON.parse(fs.readFileSync("verification_result.json"));
const ocrLines = json._raw.front.ocrLines;
// The imgWidth may not have been saved in the cache if the verification result is old. Provide a reasonable fallback.
const imgWidth = json._raw.front.imgWidth || 1000;

console.log(JSON.stringify(extractValidityDates(ocrLines, imgWidth), null, 2));

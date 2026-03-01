import { extractValidityDates } from "./src/core/dates/issueDate.js";

const ocrLines = [
  { text: "Date of Issue 2026/02/10", bbox: { x0: 600, x1: 800, y0: 100, y1: 120 } },
  { text: "Expiry date 2034/02/08", bbox: { x0: 600, x1: 800, y0: 150, y1: 170 } }
];

console.log(JSON.stringify(extractValidityDates(ocrLines, 1000), null, 2));

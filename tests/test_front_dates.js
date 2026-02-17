/**
 * Batch test: Run date extraction on front-side ID images.
 * Uses Tesseract CLI (TSV) → builds OCR lines → extractValidityDates
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { runTesseractCLI, parseTSV } from "../ocr/cli_ocr.js";
import { extractValidityDates } from "../ocr/date_extraction.js";
import { groupWordsIntoLines } from "../ocr/ocr_utils.js";

const SAMPLES_DIR = "/home/amde/Documents/et-id-ocr-test/assets/samples/front";

async function testImage(imagePath) {
  const filename = path.basename(imagePath);
  console.log(`\n━━━ ${filename} ━━━`);

  // Preprocess: resize to 2000px wide, grayscale, normalize
  const tmpPath = `/tmp/front_test_${Date.now()}.png`;
  await sharp(imagePath)
    .resize(2000)
    .grayscale()
    .normalize()
    .toFile(tmpPath);

  const meta = await sharp(tmpPath).metadata();
  const imgWidth = meta.width;

  // Run Tesseract TSV (PSM 3 = auto)
  const tsvData = runTesseractCLI(tmpPath, "tsv", { psm: 3 });
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  if (!tsvData) {
    console.log("  ⚠ Tesseract failed");
    return { image: filename, error: "Tesseract failed" };
  }

  const words = parseTSV(tsvData);
  const ocrLines = groupWordsIntoLines(words);

  // Show raw OCR lines for debugging
  console.log(`  OCR lines (${ocrLines.length}):`);
  for (const l of ocrLines) {
    const col = l.bbox ? (((l.bbox.x0 + l.bbox.x1) / 2) > imgWidth * 0.55 ? "R" : "L") : "?";
    console.log(`    [${col}] "${l.text}"`);
  }

  // Extract validity dates
  const result = extractValidityDates(ocrLines, imgWidth);
  const v = result.validity;
  console.log(`  Result:`);
  console.log(`    Issue:  ${v.issue.gc || "null"} (EC: ${v.issue.ec || "null"}) conf=${v.confidence}`);
  console.log(`    Expiry: ${v.expiry.gc || "null"} (EC: ${v.expiry.ec || "null"}) method=${v.method}`);

  return { image: filename, validity: result.validity, ocrLines: ocrLines.map(l => ({ text: l.text, x: (l.bbox.x0 + l.bbox.x1)/2 })) };
}

async function main() {
  const files = fs.readdirSync(SAMPLES_DIR)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .sort();

  console.log(`Testing ${files.length} front-side images from ${SAMPLES_DIR}\n`);

  const results = [];
  for (const f of files) {
    const r = await testImage(path.join(SAMPLES_DIR, f));
    results.push(r);
  }

  // Summary
  console.log("\n\n══════ SUMMARY ══════");
  let found = 0;
  for (const r of results) {
    const issue = r.validity?.issue?.gc || "—";
    const expiry = r.validity?.expiry?.gc || "—";
    const hasAny = issue !== "—" || expiry !== "—";
    if (hasAny) found++;
    console.log(`  ${r.image}: Issue=${issue}  Expiry=${expiry}`);
  }
  console.log(`\n  Dates found: ${found}/${results.length} images`);

  // Save results
  const outPath = "/home/amde/Documents/et-id-ocr-test/results/front_date_results.json";
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`  Results saved to ${outPath}`);
}

main().catch(console.error);

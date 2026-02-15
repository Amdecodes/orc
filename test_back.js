import { extractBackID } from "./ocr/back_scan.js";
import fs from "fs";
import path from "path";

async function runBackTest() {
  const testDir = "./samples/back";
  const images = fs.readdirSync(testDir).filter(f => f.endsWith(".png"));
  
  console.log(`Found ${images.length} images for back-side testing.\n`);

  // console.log(`Found ${images.length} images...`);

  const allResults = [];
  for (const img of images) {
    const imagePath = path.join(testDir, img);
    console.log(`--- Processing Back: ${img} ---`);
    try {
      const results = await extractBackID(imagePath);
      // console.log(JSON.stringify(results, null, 2));
      allResults.push({ image: img, results });
    } catch (e) {
      console.error(`Error processing ${img}:`, e.stack);
      allResults.push({ image: img, error: e.message });
    }
  }
  
  fs.writeFileSync('test_back_results.json', JSON.stringify(allResults, null, 2));
  console.log("Results written to test_back_results.json");
}

runBackTest();

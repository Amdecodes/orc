import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";
import { findBestAnchor } from "./ocr/anchor.js";
import { buildDynamicCrop } from "./ocr/crop.js";
import { recognizeName } from "./ocr/recognize.js";
import { getPngDimensions } from "./ocr/image_meta.js";

const startBatch = async () => {
  const images = fs.readdirSync("./samples/front").filter(f => f.match(/^image.*\.png$/) || f.endsWith(".png"));
  console.log(`Found ${images.length} images to process.`);

  const worker = await createWorker(["amh", "eng"]); // Bilingual detection
  await worker.setParameters({
      tessedit_pageseg_mode: '6', // Assume a single uniform block of text
  });

  for (const img of images) {
    const imagePath = path.join("./samples/front", img);
    console.log(`\nProcessing: ${img}`);

    try {
      // 1. Get Dimensions (Manual)
      const meta = getPngDimensions(imagePath);
      
      // 2. Full OCR to find layout
      const result = await worker.recognize(imagePath);
      const data = result.data;
      
      console.log("DEBUG TEXT:", data.text ? data.text.substring(0, 200).replace(/\n/g, " ") : "N/A");

      // 3. Probabilistic Anchor Detection
      const anchor = findBestAnchor(data.text, meta);

      if (!anchor) {
        console.log(`❌ No suitable anchor found.`);
        continue;
      }

      console.log(`📍 Best Anchor: "${anchor.text}" (Score: ${anchor.score}, Type: ${anchor.type})`);
      console.log(`   Approx Y: ${anchor.approxY} (Line: ${anchor.lineIndex}/${anchor.totalLines})`);

      // 4. Dynamic Cropping
      const nameCrop = buildDynamicCrop(anchor, meta);
      console.log(`✂️  Crop: left=${nameCrop.left}, top=${nameCrop.top}, w=${nameCrop.width}, h=${nameCrop.height}`);

      // 5. Recognized & Validate
      const resultName = await recognizeName(imagePath, nameCrop);
      
      if (resultName.valid) {
        console.log(`✅ Extracted Name: "${resultName.name}" (Score: ${resultName.score})`);
      } else {
        console.log(`⚠️  Partial/Invalid Name: "${resultName.name}" - Reason: ${resultName.error}`);
      }
      
    } catch (error) {
      console.error(`Error processing ${img}:`, error);
    }
  }

  await worker.terminate();
  console.log("\nBatch processing complete.");
};

startBatch();

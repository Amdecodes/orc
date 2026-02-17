import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";
import { findBestAnchor } from "../ocr/anchor.js";
import { buildDynamicCrop } from "../ocr/crop.js";
import { recognizeName } from "../ocr/recognize.js";
import { getImageDimensions } from "../ocr/image_meta.js";

const testSingle = async (imagePath) => {
  if (!imagePath || !fs.existsSync(imagePath)) {
    console.error("❌ Usage: node tools/test_name.js <path_to_image>");
    process.exit(1);
  }

  console.log(`\n🔍 Testing Name Extraction for: ${imagePath}`);

  let workerFull = null;
  let workerAmh = null;

  try {
    // 1. Get Dimensions
    const meta = await getImageDimensions(imagePath);
    console.log(`📏 Dimensions: ${meta.width}x${meta.height}`);
    
    // 2. Full OCR (Bilingual)
    workerFull = await createWorker(["amh", "eng"]);
    await workerFull.setParameters({
        tessedit_pageseg_mode: '6',
    });

    console.log("⏳ Running Full OCR for anchor detection...");
    const result = await workerFull.recognize(imagePath);
    const data = result.data;
    
    // 3. Anchor Detection
    const anchor = findBestAnchor(data.text, meta);

    if (!anchor) {
      console.log(`❌ No suitable anchor found in the full text.`);
      return;
    }

    console.log(`📍 Anchor Found: "${anchor.text}" (Type: ${anchor.type}, Score: ${anchor.score})`);
    console.log(`   Approx Y: ${anchor.approxY} (Line: ${anchor.lineIndex}/${anchor.totalLines})`);

    // 4. Dynamic Cropping
    const nameCrop = buildDynamicCrop(anchor, meta);
    console.log(`✂️  Crop Area: left=${nameCrop.left}, top=${nameCrop.top}, w=${nameCrop.width}, h=${nameCrop.height}`);

    // 5. Extraction & Scoring
    console.log("⏳ Running Multi-Pass Name Recognition on crop...");
    workerAmh = await createWorker("amh");
    const resultName = await recognizeName(imagePath, nameCrop, workerAmh);
    
    if (resultName.valid) {
      console.log(`\n🏆 RESULT: "${resultName.name}"`);
      console.log(`⭐ Score: ${resultName.score.toFixed(2)}`);
      console.log(`🛠️  Variant: ${resultName.variant}`);
      console.log(`✅ SUCCESS`);
    } else {
      console.log(`\n⚠️  FAILED: ${resultName.error}`);
      if (resultName.name) {
          console.log(`   Best Candidate (Invalid): "${resultName.name}" (Score: ${resultName.score.toFixed(2)})`);
      }
    }
  } catch (error) {
    console.error(`\n❌ Error during testing:`, error);
  } finally {
      if (workerFull) await workerFull.terminate();
      if (workerAmh) await workerAmh.terminate();
  }
};

const args = process.argv.slice(2);
testSingle(args[0]);

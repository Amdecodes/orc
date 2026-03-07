import fs from 'fs';
import { generateID } from './services/id-engine/src/core/generateID.js';

async function testOCR() {
  console.log("Reading images...");
  try {
    const front = fs.readFileSync('photo_3_2026-02-27_00-06-59.jpg');
    const back = fs.readFileSync('photo_2_2026-02-27_00-06-59.jpg');
    const third = fs.readFileSync('photo_1_2026-02-27_00-06-59.jpg');

    console.log("Starting OCR pipeline (this may take up to 60 seconds)...");
    const result = await generateID(front, back, third);
    
    console.log("✅ OCR Success!");
    console.log("Extracted Data:", JSON.stringify(result.data, null, 2));
    
    fs.writeFileSync('test_output_print_ready.jpg', result.image);
    fs.writeFileSync('test_output_front.jpg', result.frontBuffer);
    fs.writeFileSync('test_output_back.jpg', result.backBuffer);
    console.log("📁 Saved test outputs to: test_output_print_ready.jpg, test_output_front.jpg, test_output_back.jpg");
  } catch (err) {
    console.error("❌ OCR Failed:", err);
    process.exit(1);
  }
}

testOCR();

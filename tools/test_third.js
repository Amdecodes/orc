import fs from "fs";
import path from "path";
import { processThirdScreenshot } from "../ocr/qr_face_worker.js";

const testSingle = async (imagePath) => {
  console.log(`\n🔍 Testing QR & Profile Extraction for: ${imagePath}`);
  
  try {
    const buffer = fs.readFileSync(imagePath);
    const result = await processThirdScreenshot(buffer);

    console.log(`✅ Success! Confidence: ${result._confidence}`);
    console.log(`📦 QR Result:`, JSON.stringify(result.qr, null, 2));

    // Save outputs for visual verification
    if (result.photo_png) {
        const photoPath = "test_profile_photo.png";
        fs.writeFileSync(photoPath, Buffer.from(result.photo_png, "base64"));
        console.log(`🖼️  Portrait saved to: ${photoPath}`);
    }

    if (result.barcode_png) {
        const barcodePath = "test_barcode.png";
        fs.writeFileSync(barcodePath, Buffer.from(result.barcode_png, "base64"));
        console.log(`📊 Barcode saved to: ${barcodePath}`);
    }

  } catch (error) {
    console.error(`❌ Error during testing:`, error);
  }
};

const imagePath = process.argv[2] || "./samples/qr/photo_1_2026-02-16_09-45-11.jpg";
testSingle(imagePath);

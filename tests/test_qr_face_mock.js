import sharp from "sharp";
import bwipjs from "bwip-js";
import { processThirdScreenshot, CROP_CONFIG } from "../src/qr_face_worker.js";
import fs from "fs";

// Constants matching our REF_WIDTH/HEIGHT in worker
const REF_WIDTH = 1080;
const REF_HEIGHT = 2340;

async function createMockImage() {
    console.log("Creating mock ID image...");
    
    // 1. Create Blank Canvas
    // Use sharp to create a blank white image
    const base = sharp({
        create: {
            width: REF_WIDTH,
            height: REF_HEIGHT,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
    });

    // 2. Generate a valid QR Code
    // Payload: NAME=MOCK USER|FAN=123456789012|DOB=1990-01-01|GENDER=M
    const qrBuffer = await bwipjs.toBuffer({
        bcid: "qrcode",
        text: "NAME=MOCK USER|FAN=123456789012|DOB=1990-01-01|GENDER=M",
        scale: 3,
        padding: 5
    });

    // Resize QR to fit the crop area defined in CROP_CONFIG
    // We need to calculate pixel dimensions from the relative ratios
    const qrW = Math.round(REF_WIDTH * CROP_CONFIG.qr.w);
    const qrH = Math.round(REF_HEIGHT * CROP_CONFIG.qr.h);
    const qrX = Math.round(REF_WIDTH * CROP_CONFIG.qr.x);
    const qrY = Math.round(REF_HEIGHT * CROP_CONFIG.qr.y);

    const qrResized = await sharp(qrBuffer).resize(qrW, qrH).toBuffer();

    // 3. Create a Dummy Face
    const faceW = Math.round(REF_WIDTH * CROP_CONFIG.photo.w);
    const faceH = Math.round(REF_HEIGHT * CROP_CONFIG.photo.h);
    const faceX = Math.round(REF_WIDTH * CROP_CONFIG.photo.x);
    const faceY = Math.round(REF_HEIGHT * CROP_CONFIG.photo.y);

    const faceBuffer = await sharp({
        create: {
            width: faceW,
            height: faceH,
            channels: 4,
            background: { r: 0, g: 0, b: 255, alpha: 1 } // Blue square
        }
    })
    .composite([{
        input: Buffer.from('<svg><circle cx="50%" cy="50%" r="40%" fill="green" /></svg>'),
        gravity: 'center'
    }])
    .png()
    .toBuffer();

    // 4. Composite them onto the base
    const finalImage = await base.composite([
        { input: qrResized, top: qrY, left: qrX },
        { input: faceBuffer, top: faceY, left: faceX }
    ])
    .png()
    .toBuffer();

    // Save for visual inspection
    fs.writeFileSync("../assets/../assets/mock_id_card.png", finalImage);
    console.log("Saved ../assets/../assets/mock_id_card.png");
    
    return finalImage;
}

async function runTest() {
    try {
        const imageBuffer = await createMockImage();
        
        console.log("Processing mock image...");
        const result = await processThirdScreenshot(imageBuffer);
        
        console.log("--- RESULT ---");
        // console.log(JSON.stringify(result, null, 2));
        console.log("Photo Length:", result.photo_png.length);
        console.log("Barcode Length:", result.barcode_png ? result.barcode_png.length : "NULL");
        console.log("QR Data:", result.qr);
        console.log("Confidence:", result._confidence);

        // Assertions
        let pass = true;
        if (result.qr.fan !== "123456789012") { console.error("FAIL: FAN mismatch"); pass = false; }
        if (result.qr.full_name_en !== "MOCK USER") { console.error("FAIL: Name mismatch"); pass = false; }
        if (result.qr.gender.en !== "Male") { console.error("FAIL: Gender mismatch"); pass = false; }
        if (!result.barcode_png) { console.error("FAIL: Barcode missing"); pass = false; }
        if (result._confidence < 0.9) { console.error("FAIL: Low confidence"); pass = false; }

        if (pass) {
            console.log("✅ TEST PASSED");
            // Save outputs
            fs.writeFileSync("output/test_face.png", Buffer.from(result.photo_png, 'base64'));
            fs.writeFileSync("output/test_barcode.png", Buffer.from(result.barcode_png, 'base64'));
        } else {
            console.error("❌ TEST FAILED");
            process.exit(1);
        }

    } catch (e) {
        console.error("Test Error:", e);
        process.exit(1);
    }
}

runTest();

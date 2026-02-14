import fs from "fs";
import sharp from "sharp";
import { createWorker } from "tesseract.js";

const IMAGE_PATH = ["./image copy.png","./image.png", "./image copy 2.png", "./image copy 3.png", "./image copy 4.png", "./image copy 5.png"];

async function preprocessImage(inputPath) {
  const outputPath = "./processed.png";

  await sharp(inputPath)
    .grayscale()
    .resize({ width: 2000 }) // upscale improves OCR
    .sharpen()
    .threshold(180)
    .toFile(outputPath);

  return outputPath;
}

async function extractRegion(inputPath, region, outputPath) {
  await sharp(inputPath)
    .extract(region)
    .grayscale()
    .resize({ width: region.width * 3 }) // 3x upscale
    .normalize() // enhance details without washing out
    .toFile(outputPath);
  return outputPath;
}

function normalizeText(text) {
  return text
    .replace(/[^\p{Script=Ethiopic}\p{N}\/\|\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAmharicFields(rawText) {
  const text = normalizeText(rawText);

  const getField = (label, stopLabels) => {
    const stopPattern = stopLabels.join("|");
    const regex = new RegExp(
      label +
        "[^\\u1200-\\u137F]+" + // Skip non-Amharic chars (separators, spaces, etc.)
        "([\\u1200-\\u137F\\s]+?)" + // Capture Amharic words (lazy)
        "(?=[^\\u1200-\\u137F]*(" +
        stopPattern +
        ")|$)",
      "u"
    );

    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const normalizeForName = (text) => {
    return text
      .replace(/[^\u1200-\u137F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const extractAmharicFullName = (rawText) => {
    // 1. Stop scanning at "የትውልድ" to avoid footer noise
    const stopIndex = rawText.indexOf("የትውልድ");
    const safeText = stopIndex !== -1 ? rawText.slice(0, stopIndex) : rawText;

    // 2. Normalize
    const text = normalizeForName(safeText);
    const words = text.split(" ");
    const candidates = [];

    // 3. Sliding window for 2-4 Amharic words
    for (let i = 0; i < words.length; i++) {
      // Prioritize longer sequences (Full Name > First Name + Middle Name)
      for (let len = 4; len >= 2; len--) {
        const slice = words.slice(i, i + len);
        if (slice.length < len) continue;

        // All words must be Ethiopic and length >= 2
        const valid = slice.every((w) => /^[\u1200-\u137F]{2,}$/.test(w));
        if (!valid) continue;

        const candidateText = slice.join(" ");

        // Ignore known header words and labels
        if (/የኢትዮጵያ|ዲጂታል|መታወቂያ|ካርድ|ሪፐብሊክ|ሙሉ|ስም|ሙሱ|ሰም|ሽባ/u.test(candidateText)) continue;

        candidates.push({
          text: candidateText,
          index: i,
        });
      }
    }

    // Prefer the earliest valid candidate
    return candidates.length ? candidates[0].text : null;
  };

  return {
    full_name_am: extractAmharicFullName(rawText),
    sex_am: getField("ፆታ", ["የሚያበቃበት ቀን"]),
    dob_am: getField("የትውልድ ቀን", ["ፆታ", "የሚያበቃበት ቀን"]),
    expiry_am: getField("የሚያበቃበት ቀን", ["ካርድ"]),
    card_number: rawText.match(/\b\d{16,20}\b/)?.[0] || null,
  };
}


function scoreAmharicName(text) {
  if (!text) return 0;

  const words = text.trim().split(/\s+/);
  let score = 0;

  // 1. Word count (Valid names usually 2-4 words)
  if (words.length >= 2 && words.length <= 4) score += 2;

  // 2. Amharic character density
  const ethiopicChars = text.match(/[\u1200-\u137F]/g) || [];
  score += Math.min(ethiopicChars.length / 5, 4);

  // 3. Penalty for known noise/header words
  if (!/(የኢትዮጵያ|መታወቂያ|ካርድ)/.test(text)) score += 2;

  // 4. Penalty for repetitive noise (e.g., "uuu")
  if (/(.)\1\1/.test(text)) score -= 2;

  return score;
}

// Helper to clean Amharic text
const cleanAmharicName = (text) => {
  return text
    .replace(/[^\u1200-\u137F\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

async function extractRegionVariants(inputPath, region) {
    const variants = [];
    const base = sharp(inputPath).extract(region).grayscale();
    
    // Variant 1: Thresholding (High Contrast)
    variants.push({
        path: "variant_1.png",
        pipeline: base.clone().threshold(150)
    });

    // Variant 2: Normalize + Sharpen
    variants.push({
        path: "variant_2.png",
        pipeline: base.clone().normalize().sharpen()
    });

    // Variant 3: 3x Upscale for DPI boost (Critical for Tesseract)
    variants.push({
        path: "variant_3.png",
        pipeline: base.clone().resize({ width: region.width * 3 })
    });

    await Promise.all(variants.map(v => v.pipeline.toFile(v.path)));
    return variants.map(v => v.path);
}

async function processImage(imagePath, worker, workerAmh) {
  if (!fs.existsSync(imagePath)) {
    console.error("❌ Image not found:", imagePath);
    return null;
  }

  console.log(`\n=== Processing ${imagePath} ===`);

  // --- FULL IMAGE OCR ---
  console.log("🔧 Preprocessing image...");
  const processedImage = await preprocessImage(imagePath);

  console.log("🔍 Starting OCR (Full)...");
  const { data: { text } } = await worker.recognize(processedImage);

  const fields = extractAmharicFields(text);
  const fullNameFromFullOCR = fields.full_name_am || "";
  const fullScore = scoreAmharicName(fullNameFromFullOCR);

  console.log("\n--- FULL OCR RESULT ---");
  console.log(`Text: "${fullNameFromFullOCR}" | Score: ${fullScore}`);
  console.log(fields);


  // --- REGION-BASED OCR (Multi-Pass) ---
  console.log("\n🔍 Starting Region-Based OCR (Multi-Pass)...");
  
  // Standard ID Card Name Region
  const regionConfig = { left: 91, top: 630, width: 369, height: 72 };
  const variantPaths = await extractRegionVariants(imagePath, regionConfig);

  await workerAmh.setParameters({
    tessedit_pageseg_mode: "7", // Treat as single text line
    tessedit_char_whitelist: "" // Ensure no whitelist restrictions if not needed, or add Amharic chars
  });

  let bestRegionName = "";
  let bestRegionScore = -1;

  for (const [index, vPath] of variantPaths.entries()) {
      const { data: { text: rawRegionText } } = await workerAmh.recognize(vPath);
      const cleanRegionText = cleanAmharicName(rawRegionText);
      const score = scoreAmharicName(cleanRegionText);

      console.log(`  Variant ${index + 1}: "${cleanRegionText}" (Score: ${score})`);

      if (score > bestRegionScore) {
          bestRegionScore = score;
          bestRegionName = cleanRegionText;
      }
  }

  console.log(`\n🏆 Best Region Result: "${bestRegionName}" | Score: ${bestRegionScore}`);


  // --- FINAL SELECTION LOGIC ---
  let finalName = null;

  // Rule #1: Region OCR NEVER overrides a valid full OCR name
  if (fullScore >= bestRegionScore && fullScore >= 4) {
      finalName = fullNameFromFullOCR;
      console.log("✅ Selected FULL OCR (High Confidence)");
  } else if (bestRegionScore >= 4) {
      finalName = bestRegionName;
      console.log("✅ Selected REGION OCR (Better Score)");
  } else {
      // Fallback: If both are bad, try to salvage something or return null
      finalName = fullNameFromFullOCR || bestRegionName || null;
      console.log("⚠️ Low Confidence Selection (Fallback)");
      
      // Reject garbage if really bad
      if (finalName && scoreAmharicName(finalName) < 4) {
          console.log("❌ REJECTED Garbage Output");
          finalName = null;
      }
  }

  console.log("👉 FINAL NAME:", finalName);

  return {
    file: imagePath,
    ...fields,
    name_region_candidate: bestRegionName,
    final_name: finalName,
    scores: { full: fullScore, region: bestRegionScore }
  };
}

async function runBatch() {
  console.log("🚀 Starting Batch Processing...");
  const worker = await createWorker("eng+amh");
  const workerAmh = await createWorker("amh"); // Dedicated worker for regions

  const results = [];
  for (const imgPath of IMAGE_PATH) {
    try {
      const data = await processImage(imgPath, worker, workerAmh);
      if (data) results.push(data);
    } catch (err) {
      console.error(`❌ Error processing ${imgPath}:`, err);
    }
  }

  await worker.terminate();
  await workerAmh.terminate();
  fs.writeFileSync("result.json", JSON.stringify(results, null, 2));
  console.log("\n✅ Batch Processing Complete. Results saved to result.json");
}

runBatch().catch(console.error);

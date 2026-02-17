import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fs from "fs";

async function test() {
  const imagePath = "./samples/back/image copy 2.png";
  console.log("Testing with eng only for boxes...");
  
  // Normalize to 2000px width as per user request
  const resizedBuf = await sharp(imagePath)
    .resize(2000)
    .grayscale()
    .toBuffer();
  
  const worker = await createWorker("eng");
  
  try {
    const { data } = await worker.recognize(resizedBuf, {
        blocks: true,
        hocr: true,
        tsv: true
    });
    
    console.log("Text length:", data.text.length);
    console.log("Blocks found:", data.blocks ? data.blocks.length : "null");
    console.log("Lines found in first block:", (data.blocks && data.blocks[0]?.paragraphs[0]?.lines) ? data.blocks[0].paragraphs[0].lines.length : "N/A");
    
    if (data.blocks && data.blocks.length > 0) {
        console.log("FIRST BLOCK BBOX:", data.blocks[0].bbox);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await worker.terminate();
  }
}

test();

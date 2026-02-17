import { createWorker } from "tesseract.js";
import sharp from "sharp";

async function test() {
  const imagePath = "./samples/back/image copy 2.png";
  const resizedBuf = await sharp(imagePath).resize(2000).toBuffer();
  const worker = await createWorker("eng");
  
  try {
    // Try setting parameters to force output formats
    await worker.setParameters({
        tessedit_pageseg_mode: '3', // Auto
        tessedit_create_hocr: '1',
        tessedit_create_tsv: '1',
        tessedit_create_boxfile: '1'
    });

    const { data } = await worker.recognize(resizedBuf);
    
    console.log("Text available:", !!data.text && data.text.length > 0);
    console.log("HOCR available:", !!data.hocr && data.hocr.length > 0);
    console.log("TSV available:", !!data.tsv && data.tsv.length > 0);
    console.log("Blocks available:", !!data.blocks && data.blocks.length > 0);

  } catch (e) {
    console.error(e);
  } finally {
    await worker.terminate();
  }
}

test();

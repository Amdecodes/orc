import { createWorker } from "tesseract.js";
import sharp from "sharp";

async function test() {
  const imagePath = "../assets/samples/back/image copy 2.png";
  const resizedBuf = await sharp(imagePath).resize(2000).toBuffer();
  const worker = await createWorker("eng");
  
  try {
    const { data } = await worker.recognize(resizedBuf, {
        blocks: true,
        lines: true,
        words: true,
        hocr: true,
        tsv: true
    });
    
    console.log("Data Keys:", Object.keys(data));
    console.log("Text available:", !!data.text);
    console.log("HOCR available:", !!data.hocr);
    console.log("TSV available:", !!data.tsv);
    console.log("Blocks available:", !!data.blocks);
    console.log("Lines available:", !!data.lines);
    console.log("Words available:", !!data.words);

    if (data.lines) console.log("Lines Count:", data.lines.length);
    if (data.words) console.log("Words Count:", data.words.length);

  } catch (e) {
    console.error(e);
  } finally {
    await worker.terminate();
  }
}

test();

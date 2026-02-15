import Tesseract from "tesseract.js";
import sharp from "sharp";

async function test() {
  const imagePath = "./samples/back/image copy 2.png";
  const resizedBuf = await sharp(imagePath).resize(2000).toBuffer();
  
  console.log("Testing static Tesseract.recognize...");
  try {
    const { data } = await Tesseract.recognize(resizedBuf, "eng", {
        logger: m => {}, // silence
    });
    
    console.log("Text available:", !!data.text && data.text.length > 0);
    console.log("Blocks available:", !!data.blocks && data.blocks.length > 0);
    if (data.blocks) console.log("Blocks count:", data.blocks.length);

  } catch (e) {
    console.error(e);
  }
}

test();

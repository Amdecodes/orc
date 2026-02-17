import sharp from "sharp";
import path from "path";

async function inspect() {
    const imgPath = path.resolve("qr.jpg");
    try {
        const meta = await sharp(imgPath).metadata();
        console.log("Image Metadata:", JSON.stringify(meta, null, 2));
    } catch (e) {
        console.error("Inspect Error:", e);
    }
}
inspect();

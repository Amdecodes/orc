import sharp from "sharp";
import fs from "fs";

const file = "samples/qr/photo_1_2026-02-16_09-45-11.jpg";
const buffer = fs.readFileSync(file);
sharp(buffer).metadata().then(m => {
    console.log(`DIMS: ${m.width} x ${m.height}`);
});

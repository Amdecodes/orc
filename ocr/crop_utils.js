import sharp from "sharp";

const REF_WIDTH = 1080;
const REF_HEIGHT = 2340; // Common Android viewport

export const CROP_CONFIG = {
  photo: {
    x: 102 / REF_WIDTH,
    y: 216 / REF_HEIGHT,
    w: 383 / REF_WIDTH,
    h: 409 / REF_HEIGHT
  },
  qr: {
    x: 100 / REF_WIDTH,
    y: 625 / REF_HEIGHT,
    w: 383 / REF_WIDTH,
    h: 403 / REF_HEIGHT
  }
};

/**
 * 1. RELATIVE CROPPING
 * @param {Buffer} imageBuffer 
 * @param {{x: number, y: number, w: number, h: number}} crop 
 */
export async function cropRelative(imageBuffer, crop) {
  const meta = await sharp(imageBuffer).metadata();
  const width = meta.width;
  const height = meta.height;

  return sharp(imageBuffer).extract({
    left: Math.round(width * crop.x),
    top: Math.round(height * crop.y),
    width: Math.round(width * crop.w),
    height: Math.round(height * crop.h),
  }).toBuffer();
}

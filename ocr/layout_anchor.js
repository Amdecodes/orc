import sharp from "sharp";
import jsQR from "jsqr";

/**
 * Find the primary layout anchor (QR Code).
 * @param {Buffer} imageBuffer - Full input image
 * @returns {Promise<{type: 'QR', bbox: {x,y,w,h}, raw: Object} | null>}
 */
export async function findLayoutAnchor(imageBuffer) {
    // 1. Prepare Image for jsQR (Raw RGBA)
    // Resize to max 1600px width/height to ensure speed/memory safety while keeping detail
    const { data, info } = await sharp(imageBuffer)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    // 2. Scan for QR
    const code = jsQR(new Uint8ClampedArray(data), width, height);

    if (code) {
        // jsQR returns location points. We need a bounding box.
        const loc = code.location;
        const minX = Math.min(loc.topLeftCorner.x, loc.topRightCorner.x, loc.bottomLeftCorner.x, loc.bottomRightCorner.x);
        const maxX = Math.max(loc.topLeftCorner.x, loc.topRightCorner.x, loc.bottomLeftCorner.x, loc.bottomRightCorner.x);
        const minY = Math.min(loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomLeftCorner.y, loc.bottomRightCorner.y);
        const maxY = Math.max(loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomLeftCorner.y, loc.bottomRightCorner.y);

        // Convert back to ORIGINAL image coordinates if we resized
        // We need original metadata to calculate scale ratio
        const origMeta = await sharp(imageBuffer).metadata();
        const scaleX = origMeta.width / width;
        const scaleY = origMeta.height / height;

        return {
            type: 'QR',
            bbox: {
                x: Math.round(minX * scaleX),
                y: Math.round(minY * scaleY),
                w: Math.round((maxX - minX) * scaleX),
                h: Math.round((maxY - minY) * scaleY)
            },
            // Return raw QR data too, saving a decode step!
            raw: code
        };
    }

    return null;
}

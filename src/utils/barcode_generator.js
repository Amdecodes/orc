import bwipjs from 'bwip-js';

/**
 * Generates a 1D Code 128 barcode from the given text.
 * @param {string} text - The text to encode (e.g., FAN).
 * @returns {Promise<Buffer>} - PNG buffer of the barcode.
 */
export async function generateBarcode(text) {
    if (!text) return null;
    
    return new Promise((resolve, reject) => {
        bwipjs.toBuffer({
            bcid: 'code128',       // Barcode type
            text: text,            // Text to encode
            scale: 3,              // 3x scaling factor
            height: 10,            // Bar height, in millimeters
            includetext: false,    // Hide human-readable text
            textxalign: 'center',  // Center-aligned text
        }, (err, png) => {
            if (err) {
                console.error('Barcode Generation Error:', err);
                reject(err);
            } else {
                resolve(png);
            }
        });
    });
}

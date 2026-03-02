/**
 * generateID.js — Core Entry Point
 *
 * Single function that takes 3 raw image Buffers and returns a print-ready
 * PNG Buffer. Zero side-effects: no file I/O, no console.log, no env vars.
 *
 * Usage:
 *   import { generateID } from './src/core/generateID.js';
 *   const { image, format, width, height } = await generateID(front, back, third);
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from '../pipeline/runPipeline.js';
import { renderFrontBuffer, renderBackBuffer } from './image/renderCards.js';
import { composePrintBuffer } from './image/composePrint.js';
import { IdentityExtractionError } from './errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Both template images live in the id-engine package root — 2 levels up from src/core/
const ENGINE_ROOT = path.resolve(__dirname, '../../');
const FRONT_TEMPLATE = path.join(ENGINE_ROOT, 'front_V5.0.png');
const BACK_TEMPLATE  = path.join(ENGINE_ROOT, 'back_v5.0.png');

// Print-ready canvas size (front + back side by side)
const PRINT_WIDTH  = 5944;
const PRINT_HEIGHT = 1778;

/**
 * Generate a print-ready ID card image from three raw images.
 *
 * @param {Buffer} front - Front-side photo of the ID card
 * @param {Buffer} back  - Back-side photo of the ID card
 * @param {Buffer} third - Third image (selfie with QR code)
 * @returns {Promise<{ image: Buffer, frontBuffer: Buffer, backBuffer: Buffer, format: 'jpg', width: number, height: number, data: object }>}
 * @throws {IdentityExtractionError} on validation or processing failure
 */
export async function generateID(front, back, third) {
    // 1. Validate inputs
    if (!Buffer.isBuffer(front) || !Buffer.isBuffer(back) || !Buffer.isBuffer(third)) {
        throw new IdentityExtractionError(
            'INVALID_INPUT',
            'generateID requires all three inputs to be Buffers (front, back, third)'
        );
    }

    // 2. Run OCR + QR pipeline (existing logic, untouched)
    let pipelineResult;
    try {
        pipelineResult = await runPipeline(front, back, third);
    } catch (err) {
        throw new IdentityExtractionError('OCR_FAILED', `Pipeline failed: ${err.message}`);
    }

    // 3. Render front and back onto their template images → JPG Buffers
    let frontBuf, backBuf;
    try {
        [frontBuf, backBuf] = await Promise.all([
            renderFrontBuffer(pipelineResult, FRONT_TEMPLATE),
            renderBackBuffer(pipelineResult, BACK_TEMPLATE),
        ]);
    } catch (err) {
        throw new IdentityExtractionError('RENDER_FAILED', `Card rendering failed: ${err.message}`);
    }

    // 4. Compose front + back into a single print-ready layout → PNG Buffer
    let printBuf;
    try {
        printBuf = await composePrintBuffer(frontBuf, backBuf);
    } catch (err) {
        throw new IdentityExtractionError('RENDER_FAILED', `Print composition failed: ${err.message}`);
    }

    return {
        image:       printBuf,
        frontBuffer: frontBuf,
        backBuffer:  backBuf,
        format:      'jpeg',
        width:       PRINT_WIDTH,
        height:      PRINT_HEIGHT,
        // Expose pipeline result for callers that need structured data too
        data:        pipelineResult,
    };
}

/**
 * Typed error classes for the core generateID pipeline.
 *
 * Usage:
 *   throw new IdentityExtractionError('OCR_FAILED', 'Tesseract returned empty text');
 *
 * Adapters (telegram, web, api) catch these and handle them appropriately.
 */

export class IdentityExtractionError extends Error {
    /**
     * @param {'INVALID_INPUT' | 'OCR_FAILED' | 'ISSUE_DATE_NOT_FOUND' | 'DOB_COLLISION' | 'RENDER_FAILED'} code
     * @param {string} message
     */
    constructor(code, message) {
        super(message);
        this.name = 'IdentityExtractionError';
        this.code = code;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, IdentityExtractionError);
        }
    }
}

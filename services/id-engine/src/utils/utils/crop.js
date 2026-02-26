export function buildNameCrop(anchor, imageMeta) {
  const paddingX = 12;
  const paddingY = 6;
  
  return {
    left: Math.max(anchor.bbox.x1 + paddingX, 0),
    top: Math.max(anchor.bbox.y0 - paddingY, 0),
    width: Math.min(500, imageMeta.width - (anchor.bbox.x1 + paddingX)),
    height: 70
  };
}

/**
 * FIXED GEOMETRIC CROP for Front Name
 * - X: 10% -> 90%
 * - Y: 35% -> 60%
 */
export function getFrontNameCrop(meta) {
    return {
        left: Math.floor(meta.width * 0.10),
        top: Math.floor(meta.height * 0.35),
        width: Math.floor(meta.width * 0.80),
        height: Math.floor(meta.height * 0.25)
    };
}

/**
 * FIXED GEOMETRIC CROP for Front DOB fallback
 */
export function getFrontDobCrop(meta) {
    return {
        left: Math.floor(meta.width * 0.10),
        top: Math.floor(meta.height * 0.60),
        width: Math.floor(meta.width * 0.80),
        height: Math.floor(meta.height * 0.15)
    };
}

export function buildDynamicCrop(anchor, meta) {
  // Constants
  const LEFT_PCT = 0.15; // 15% from left
  const WIDTH_PCT = 0.80; // capture 80% width (up to 95% right)
  
  // Vertical Logic
  // Primary (Full Name): Name is BELOW.
  // Secondary (DOB): Name is ABOVE.
  
  let top, height;
  
  // Estimate line height from image meta (rough average)
  // or use a fixed percentage. 
  // Let's use a percentage of height as "line height assumption" ~ 4-5%
  const EST_LINE_H = meta.height * 0.05;

  if (anchor.type === 'primary') {
    // Primary: Name is BELOW or ON THE SAME LINE.
    // Tesseract often merges "Full Name" detection with the value.
    // So we must capture the ANCHOR LINE itself + the line below.
    // Start 50% of a line height ABOVE the detected anchor Y to be safe.
    top = anchor.approxY - (EST_LINE_H * 0.5); 
    // Capture ~3 lines to be safe (Anchor + 2 lines below)
    height = EST_LINE_H * 3.0; 
  } else {
    // Secondary: DOB is below name.
    // We want the lines ABOVE DOB.
    // Go up ~2.5 lines.
    top = anchor.approxY - (EST_LINE_H * 2.5);
    height = EST_LINE_H * 2.5;
  }

  const left = Math.floor(meta.width * LEFT_PCT);
  const width = Math.floor(meta.width * WIDTH_PCT);
  
  // Clamp
  const safeLeft = Math.max(0, Math.min(left, meta.width - 1));
  const safeTop = Math.max(0, Math.min(top, meta.height - 1));
  const safeWidth = Math.max(1, Math.min(width, meta.width - safeLeft));
  const safeHeight = Math.max(1, Math.min(height, meta.height - safeTop));

  return {
    left: safeLeft,
    top: Math.floor(safeTop),
    width: safeWidth,
    height: Math.floor(safeHeight),
  };
}
/**
 * Generalized crop builder for any ID field.
 * @param {object} anchor - The anchor object from findBestAnchor or findBackAnchors
 * @param {object} meta - Image dimensions
 * @param {string} fieldType - 'name', 'phone', 'fin', 'address', 'nationality'
 */
export function buildFieldCrop(anchor, meta, fieldType) {
  const EST_LINE_H = meta.height * 0.05;
  let top, height, left, width;

  // 1. Vertical Logic based on Field Type
  switch (fieldType) {
    case 'name':
      if (anchor.bbox) {
        // Horizontal logic (Side-by-Side as per user)
        top = anchor.bbox.y0 - (EST_LINE_H * 0.2);
        height = EST_LINE_H * 1.5;
        left = anchor.bbox.x1 + 10; // Start right of label
        width = meta.width - left - 10;
      } else {
        // Fallback vertical logic
        top = anchor.type === 'primary' ? anchor.approxY - (EST_LINE_H * 0.5) : anchor.approxY - (EST_LINE_H * 2.5);
        height = anchor.type === 'primary' ? EST_LINE_H * 3.0 : EST_LINE_H * 2.5;
        left = meta.width * 0.15;
        width = meta.width * 0.80;
      }
      break;

    case 'phone':
    case 'fin':
      // Tight window around/below the label
      top = anchor.approxY - (EST_LINE_H * 0.2);
      height = EST_LINE_H * 1.8;
      left = meta.width * 0.05; // Phone/FIN often start more to the left
      width = meta.width * 0.60; // Keep away from QR on the right
      break;

    case 'address':
      // Address is usually multi-line
      top = anchor.approxY - (EST_LINE_H * 0.2);
      height = EST_LINE_H * 4.5; // Capture 4-5 lines
      left = meta.width * 0.05;
      width = meta.width * 0.55; // QR occupies the right side
      break;

    case 'nationality':
      top = anchor.approxY - (EST_LINE_H * 0.2);
      height = EST_LINE_H * 2.5;
      left = meta.width * 0.05;
      width = meta.width * 0.60;
      break;

    default:
      // Fallback
      top = anchor.approxY;
      height = EST_LINE_H * 2;
      left = 0;
      width = meta.width;
  }

  // 2. QR Code Masking (Conceptual)
  // Most back-side IDs have the QR code in the bottom 50% and right 50%.
  // By limiting 'width' to 60%, we naturally stay away from the QR core for text extraction.

  // 3. Clamp & Return
  const safeLeft = Math.max(0, Math.min(left, meta.width - 1));
  const safeTop = Math.max(0, Math.min(top, meta.height - 1));
  const safeWidth = Math.max(1, Math.min(width, meta.width - safeLeft));
  const safeHeight = Math.max(1, Math.min(height, meta.height - safeTop));

  return {
    left: Math.floor(safeLeft),
    top: Math.floor(safeTop),
    width: Math.floor(safeWidth),
    height: Math.floor(safeHeight)
  };
}

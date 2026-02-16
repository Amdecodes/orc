import * as faceDetection from '@tensorflow-models/face-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-wasm'; // Import backend
import sharp from 'sharp';

let detector = null;

// Initialize detector lazily
async function getDetector() {
    if (detector) return detector;

    console.log("Initializing TFJS WASM Backend...");
    await tf.setBackend('wasm');
    await tf.ready();
    console.log("TFJS Backend set to:", tf.getBackend());

    const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
    const detectorConfig = {
        runtime: 'tfjs', 
        maxFaces: 1,
        modelType: 'short'
    };
    detector = await faceDetection.createDetector(model, detectorConfig);
    return detector;
}

/**
 * Detect face in image buffer.
 * @param {Buffer} imageBuffer 
 */
export async function detectFace(imageBuffer) {
    const detector = await getDetector();

    // Decode image to tensor using sharp (raw pixel data)
    // TFJS expects RGB or RGBA.
    // Sharp defaults to 3 channels (RGB) if not specified, 
    // but input might be 4 if PNG. Let's ensure consistent input.
    // MediaPipe usually works with RGB.

    const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Create tensor from raw data
    // shape: [height, width, channels]
    const tensor = tf.tensor3d(data, [info.height, info.width, info.channels], 'int32');
    
    let inputTensor = tensor;
    if (info.channels === 4) {
        // MediaPipe expects RGB (3 channels)
        inputTensor = tf.slice3d(tensor, [0, 0, 0], [info.height, info.width, 3]);
    }
    
    try {
        const faces = await detector.estimateFaces(inputTensor);
        
        if (faces && faces.length > 0) {
            return faces[0];
        }
        return null;
    } finally {
        if (inputTensor !== tensor) inputTensor.dispose();
        tensor.dispose();
    }
}

/**
 * Calculate portrait crop coordinates (Head & Shoulders).
 * @param {Object} detection - TFJS detection object
 * @param {number} imgWidth 
 * @param {number} imgHeight
 */
export function getPortraitCrop(detection, imgWidth, imgHeight) {
    if (!detection || !detection.box) return null;

    const { box } = detection;
    const { xMin, yMin, width, height } = box;
    
    const xCenter = xMin + width / 2;

    // Correct Crop Formula (FINAL per User Request)
    const TOP_EXPAND    = 0.35; // increased to prevent head cut
    const BOTTOM_EXPAND = 0.55;
    const SIDE_EXPAND   = 0.75;

    const crop = {
        x: xCenter - width * SIDE_EXPAND,
        y: yMin - height * TOP_EXPAND,           // ← FIXES HEAD CUT
        width:  width * (SIDE_EXPAND * 2),
        height: height * (TOP_EXPAND + BOTTOM_EXPAND + 1),
    };

    // Round and Clamp
    const finalX = Math.round(crop.x);
    const finalY = Math.round(crop.y);
    const finalW = Math.round(crop.width);
    const finalH = Math.round(crop.height);

    const safeX = Math.max(0, finalX);
    const safeY = Math.max(0, finalY);
    const safeW = Math.min(imgWidth - safeX, finalW);
    const safeH = Math.min(imgHeight - safeY, finalH);

    return {
        left: safeX,
        top: safeY,
        width: safeW,
        height: safeH
    };
}

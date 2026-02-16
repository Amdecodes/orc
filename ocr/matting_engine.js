import ort from 'onnxruntime-node';
import sharp from 'sharp';
import path from 'path';

let session = null;

/**
 * Initialize MODNet Inference Session.
 */
async function getSession() {
    if (session) return session;
    const modelPath = path.resolve('./models/modnet_photographic.onnx');
    session = await ort.InferenceSession.create(modelPath);
    console.log("MODNet Matting Session initialized.");
    return session;
}

/**
 * Remove background from portrait image using MODNet.
 * @param {Buffer} imageBuffer - Input portrait crop buffer
 * @returns {Buffer} - Output PNG buffer with background removed (white background)
 */
export async function removeBackground(imageBuffer) {
    const session = await getSession();
    const meta = await sharp(imageBuffer).metadata();
    
    // 1. Preprocess: Resize to 512x512 and get RGB floats
    const inputSize = 512;
    const { data, info } = await sharp(imageBuffer)
        .resize(inputSize, inputSize, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Normalize to [0, 1] and substract mean/std (often 0.5 for MODNet)
    // Actually standard MODNet just wants [0, 1] normalized.
    // Shape: [1, 3, 512, 512]
    const floatData = new Float32Array(inputSize * inputSize * 3);
    for (let i = 0; i < data.length; i += 3) {
        floatData[i / 3] = (data[i] - 127.5) / 127.5; // Normalized to [-1, 1]
        floatData[i / 3 + inputSize * inputSize] = (data[i + 1] - 127.5) / 127.5;
        floatData[i / 3 + 2 * inputSize * inputSize] = (data[i + 2] - 127.5) / 127.5;
    }

    const inputTensor = new ort.Tensor('float32', floatData, [1, 3, inputSize, inputSize]);

    // 2. Inference
    const results = await session.run({ [session.inputNames[0]]: inputTensor });
    const output = results[session.outputNames[0]]; 
    
    // 3. Post-process Alpha Matte
    const alphaBuffer = Buffer.alloc(inputSize * inputSize);
    for (let i = 0; i < output.data.length; i++) {
        // Apply alpha thresholding (clamp 0.1 to 1.0) as requested by user
        let val = output.data[i];
        if (val < 0.1) val = 0; // A bit more aggressive for low values
        else if (val > 0.9) val = 1.0; // Solidify top values
        
        alphaBuffer[i] = Math.round(val * 255);
    }

    // 4. Validate Shirt Retention (Quality Gate)
    const shirtConf = validateShirt(alphaBuffer, inputSize, inputSize);
    console.log(`Shirt Integrity Check: ${shirtConf ? "PASS" : "FAIL"}`);

    // 5. Composite back to original size
    // We create a mask, blur it slightly for feathering, then composite.
    const mask = await sharp(alphaBuffer, { raw: { width: inputSize, height: inputSize, channels: 1 } })
        .resize(meta.width, meta.height)
        .blur(1.5) // Subtle feathering
        .png() // Explicitly convert mask to PNG for joinChannel compatibility
        .toBuffer();

    const outputImage = await sharp(imageBuffer)
        .ensureAlpha()
        .joinChannel(mask) // This adds alpha channel
        .flatten({ background: '#FFFFFF' }) // Composite with White Background
        .png()
        .toBuffer();

    return {
        buffer: outputImage,
        shirtConfidence: shirtConf ? 1.0 : 0.5
    };
}

/**
 * Quality Gate: Check if clothes are missing.
 * Bottom 20% must have significant foreground pixels.
 */
function validateShirt(alphaData, width, height) {
    const bottomHeight = Math.floor(height * 0.2);
    const startIndex = (height - bottomHeight) * width;
    let foregroundPixels = 0;
    for (let i = startIndex; i < alphaData.length; i++) {
        if (alphaData[i] > 128) foregroundPixels++;
    }
    const ratio = foregroundPixels / (width * bottomHeight);
    return ratio > 0.20; // 20% threshold for shirt
}

import sharp from 'sharp';

export async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    console.error(`Error getting dimensions for ${filePath}:`, error.message);
    throw error;
  }
}

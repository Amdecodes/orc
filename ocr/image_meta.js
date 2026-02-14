import fs from 'fs';

export function getPngDimensions(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(24);
  fs.readSync(fd, buffer, 0, 24, 0);
  fs.closeSync(fd);

  // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error('Not a valid PNG file');
  }

  // IHDR starts at byte 12?
  // Length (4), ChunkType (4) "IHDR", Width (4), Height (4)
  // Offset 0: Signature (8)
  // Offset 8: Length (4)
  // Offset 12: ChunkType "IHDR" (4)
  // Offset 16: Width (4) - Big Endian
  // Offset 20: Height (4) - Big Endian

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  return { width, height };
}

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  createSecretKey,
  KeyObject,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV — standard for GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

/** Derives a stable 32-byte key from the FILE_ENCRYPTION_KEY env var. */
function getKey(): KeyObject {
  const secret = process.env.FILE_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "FILE_ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: openssl rand -hex 32",
    );
  }
  // SHA-256 produces exactly 32 bytes — correct size for AES-256
  const keyBytes = createHash("sha256").update(secret).digest();
  return createSecretKey(new Uint8Array(keyBytes));
}

/** Convert any Buffer or Uint8Array to a plain Uint8Array. */
function toU8(input: ArrayLike<number>): Uint8Array {
  return Uint8Array.from(input);
}

/**
 * Encrypts binary data using AES-256-GCM.
 * Returns a Buffer containing: [IV: 12 bytes][AuthTag: 16 bytes][Ciphertext]
 */
export function encryptBuffer(plaintext: Buffer | Uint8Array): Buffer {
  const key = getKey();
  const iv = new Uint8Array(randomBytes(IV_LENGTH));
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    toU8(cipher.update(toU8(plaintext))),
    toU8(cipher.final()),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([toU8(iv), toU8(tag), toU8(encrypted)]);
}

/**
 * Decrypts data that was produced by encryptBuffer().
 * Throws if the data is corrupted or the key is wrong (GCM auth tag mismatch).
 */
export function decryptBuffer(ciphertext: Buffer | Uint8Array): Buffer {
  const key = getKey();
  const data = toU8(ciphertext);
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    toU8(decipher.update(toU8(encrypted))),
    toU8(decipher.final()),
  ]);
}

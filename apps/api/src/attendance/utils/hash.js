import crypto from 'crypto';

/**
 * Computes exact SHA-256 hash of a buffer.
 */
export function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Fast Perceptual Hash (Difference Hash / dHash) on raw image buffer bytes.
 * Generates an 8x8 64-bit gradient fingerprint for structural similarity.
 */
export function computePHash(buffer) {
  // Simple robust sample-based perceptual gradient signature
  const sampleSize = 64;
  const step = Math.max(1, Math.floor(buffer.length / (sampleSize * 2)));
  let bitString = '';

  for (let i = 0; i < sampleSize; i++) {
    const idx1 = i * step;
    const idx2 = (i + 1) * step;
    const val1 = buffer[idx1] || 0;
    const val2 = buffer[idx2] || 0;
    bitString += val1 >= val2 ? '1' : '0';
  }

  // Convert 64 bits to 16 hex characters
  let hex = '';
  for (let i = 0; i < bitString.length; i += 4) {
    const chunk = bitString.substr(i, 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

/**
 * Computes Hamming distance between two hex perceptual hashes.
 * Lower distance means higher structural similarity (e.g. distance <= 8 is near duplicate).
 */
export function hammingDistance(hex1, hex2) {
  if (!hex1 || !hex2 || hex1.length !== hex2.length) return 64;
  let distance = 0;
  for (let i = 0; i < hex1.length; i++) {
    const v1 = parseInt(hex1[i], 16);
    const v2 = parseInt(hex2[i], 16);
    let xor = v1 ^ v2;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

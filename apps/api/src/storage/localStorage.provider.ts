import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { IStorageProvider, IStorageUploadResult } from '@nirikshan/shared-types';
import { logger } from '../utils/logger';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir?: string, baseUrl: string = '/uploads') {
    this.baseDir = baseDir || path.resolve(process.cwd(), 'uploads');
    this.baseUrl = baseUrl;
    this.ensureDirectoryExists(this.baseDir);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    return `${base}_${uniqueSuffix}${ext}`;
  }

  public async uploadFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    folder: string = 'evidence',
  ): Promise<IStorageUploadResult> {
    const targetDir = path.join(this.baseDir, folder);
    this.ensureDirectoryExists(targetDir);

    const safeFilename = this.sanitizeFilename(originalFilename);
    const filePath = path.join(targetDir, safeFilename);

    // Compute cryptographic SHA-256 hash
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Write file to local disk
    await fs.promises.writeFile(filePath, fileBuffer);

    const relativeKey = path.join(folder, safeFilename).replace(/\\/g, '/');
    const url = `${this.baseUrl}/${relativeKey}`;

    logger.info(
      { key: relativeKey, size: fileBuffer.length, sha256Hash },
      '📁 File stored successfully in Local Storage',
    );

    return {
      url,
      key: relativeKey,
      size: fileBuffer.length,
      mimeType,
      sha256Hash,
    };
  }

  public async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    const safePath = path.resolve(this.baseDir, key);
    if (!safePath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Path traversal detected');
    }

    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${key}`);
    }

    return fs.createReadStream(safePath);
  }

  public async getFileBuffer(key: string): Promise<Buffer> {
    const safePath = path.resolve(this.baseDir, key);
    if (!safePath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Path traversal detected');
    }

    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${key}`);
    }

    return fs.promises.readFile(safePath);
  }

  public async deleteFile(key: string): Promise<void> {
    const safePath = path.resolve(this.baseDir, key);
    if (!safePath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Path traversal detected');
    }

    if (fs.existsSync(safePath)) {
      await fs.promises.unlink(safePath);
      logger.info({ key }, '🗑️ File deleted from Local Storage');
    }
  }

  public async verifyIntegrity(key: string, expectedHash: string): Promise<boolean> {
    try {
      const buffer = await this.getFileBuffer(key);
      const actualHash = crypto.createHash('sha256').update(buffer).digest('hex');
      return actualHash.toLowerCase() === expectedHash.toLowerCase();
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to verify file integrity');
      return false;
    }
  }
}

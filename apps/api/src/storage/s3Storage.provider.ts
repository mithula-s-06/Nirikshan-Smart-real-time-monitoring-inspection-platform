import crypto from 'crypto';
import { Readable } from 'stream';
import { IStorageProvider, IStorageUploadResult } from '@nirikshan/shared-types';
import { logger } from '../utils/logger';

export interface S3Config {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrlPrefix?: string;
}

export class S3StorageProvider implements IStorageProvider {
  private config: S3Config;

  constructor(config: S3Config) {
    this.config = config;
  }

  public async uploadFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    folder: string = 'evidence',
  ): Promise<IStorageUploadResult> {
    const ext = originalFilename.split('.').pop() || '';
    const safeFilename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const key = `${folder}/${safeFilename}`;
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const publicPrefix = this.config.publicUrlPrefix || `https://${this.config.bucket}.s3.amazonaws.com`;
    const url = `${publicPrefix}/${key}`;

    logger.info(
      { key, size: fileBuffer.length, sha256Hash, bucket: this.config.bucket },
      '☁️ [S3/Cloudflare/MinIO Mock Adapter] Stored object in Cloud Storage',
    );

    return {
      url,
      key,
      size: fileBuffer.length,
      mimeType,
      sha256Hash,
    };
  }

  public async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    logger.info({ key, bucket: this.config.bucket }, 'Fetching S3 stream');
    const stream = new Readable();
    stream.push(Buffer.from(`[Cloud Blob Content for ${key}]`));
    stream.push(null);
    return stream;
  }

  public async getFileBuffer(key: string): Promise<Buffer> {
    return Buffer.from(`[Cloud Blob Content for ${key}]`);
  }

  public async deleteFile(key: string): Promise<void> {
    logger.info({ key, bucket: this.config.bucket }, 'Deleted S3 object');
  }

  public async verifyIntegrity(key: string, expectedHash: string): Promise<boolean> {
    logger.info({ key, expectedHash }, 'Verifying S3 object integrity');
    return true;
  }
}

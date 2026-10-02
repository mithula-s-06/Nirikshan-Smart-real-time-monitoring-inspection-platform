import { IStorageProvider } from '@nirikshan/shared-types';
import { LocalStorageProvider } from './localStorage.provider';
import { S3StorageProvider } from './s3Storage.provider';
import { env } from '../config/env';

let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  // Default to local storage provider for reliable on-prem / offline / dev deployments
  storageInstance = new LocalStorageProvider();
  return storageInstance;
}

export { IStorageProvider, LocalStorageProvider, S3StorageProvider };

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';
import { logger } from '../utils/logger';

let mongoMemoryServer: MongoMemoryServer | null = null;

let isConnecting = false;

export async function connectDatabase(): Promise<void> {
  if (isConnecting) return;
  isConnecting = true;
  const uri = env.MONGODB_URI;

  try {
    logger.info({ uri: uri.replace(/:\/\/.*@/, '://***@') }, 'Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    logger.info('✅ Successfully connected to MongoDB database.');
  } catch (error: any) {
    logger.warn(`⚠️ Primary MongoDB unavailable at ${uri}: ${error.message || error}`);
    
    if (env.USE_MEMORY_DB) {
      try {
        logger.info('Starting embedded MongoDB Memory Server for standalone development/testing...');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        await mongoose.connect(memUri);
        logger.info({ memUri }, '✅ Connected to embedded in-memory MongoDB server.');
      } catch (memErr: any) {
        logger.warn(`⚠️ Could not launch in-memory MongoDB (${memErr.message}). Starting API in disconnected standby mode.`);
      }
    } else {
      logger.warn('⚠️ Starting API in disconnected database standby mode (will retry on incoming requests or background).');
    }
  } finally {
    isConnecting = false;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB runtime connection error');
  });
}

export async function disconnectDatabase(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    logger.info('Database connection closed.');
  } catch (err) {
    logger.error({ err }, 'Error closing database connection');
  }
}

export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' | 'memory_fallback' {
  if (mongoMemoryServer && mongoose.connection.readyState === 1) {
    return 'memory_fallback';
  }
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}

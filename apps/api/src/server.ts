import http from 'http';
import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeSocketServer } from './socket/socket.server';
import { logger } from './utils/logger';
import { User } from './models/user.model';
import { Beneficiary } from './models/beneficiary.model';
import { seedData } from './seed/seed';
import { seedExtensions } from './seed/seedExtensions';

async function bootstrap() {
  try {
    // 1. Connect to Database (MongoDB or In-Memory fallback for seamless dev)
    await connectDatabase();

    // Auto-seed if database is connected and empty (e.g. fresh MongoDB or in-memory MongoDB)
    if (mongoose.connection.readyState === 1) {
      try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          logger.info('🌱 Empty database detected. Auto-seeding core demo data...');
          await seedData();
        }
        const benCount = await Beneficiary.countDocuments();
        if (benCount === 0) {
          logger.info('🌱 Seeding extended intelligence data (beneficiaries, VC sessions, gazette)...');
          await seedExtensions();
        }
      } catch (seedErr: any) {
        logger.warn(`Could not auto-seed data: ${seedErr.message}`);
      }
    }

    // 2. Initialize Express application & Socket.IO Telemetry Server
    const app = createApp();
    const server = http.createServer(app);
    initializeSocketServer(server);

    // 3. Start Listening
    server.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 NIRIKSHAN API Server running on port ${env.PORT}`);
      logger.info(`📍 Health Endpoint: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`=======================================================`);
    });

    // 4. Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await disconnectDatabase();
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during database disconnect');
          process.exit(1);
        }
      });

      // Force shutdown after 10s if hanging
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: Error) => {
      logger.error({ err: reason }, 'Unhandled Promise Rejection');
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error({ err: error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to bootstrap NIRIKSHAN API Server');
    process.exit(1);
  }
}

bootstrap();

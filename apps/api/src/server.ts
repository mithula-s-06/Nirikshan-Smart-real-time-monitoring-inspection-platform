import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeSocketServer } from './socket/socket.server';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // 1. Connect to Database (MongoDB or In-Memory fallback for seamless dev)
    await connectDatabase();

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

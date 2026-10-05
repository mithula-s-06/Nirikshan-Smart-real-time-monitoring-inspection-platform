import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { apiRouter } from './routes';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  // 2. CORS Handling
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-idempotency-key'],
    }),
  );

  // 3. Rate Limiting
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // Limit each IP to 300 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
  });
  app.use(limiter);

  // 4. Request Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 5. Structured Request Logging & Request ID tracing
  app.use(requestLogger);

  // 6. Serve static uploads (for local storage provider)
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // 7. Mount API Routes (supporting both /api/v1 and /api for full ecosystem compatibility)
  app.use(env.API_PREFIX, apiRouter);
  app.use('/api', apiRouter);

  // 8. Serve Production Admin Web SPA if built & enabled
  const possibleDistPaths = [
    path.resolve(process.cwd(), 'apps/admin-web/dist'),
    path.resolve(__dirname, '../../../apps/admin-web/dist'),
    path.resolve(__dirname, '../../admin-web/dist'),
  ];
  const adminWebDist = possibleDistPaths.find((p) => fs.existsSync(p));

  if (adminWebDist && (env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true')) {
    app.use(express.static(adminWebDist));
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/socket.io')
      ) {
        return next();
      }
      res.sendFile(path.join(adminWebDist, 'index.html'));
    });
  } else {
    // Base root route
    app.get('/', (_req, res) => {
      res.json({
        name: 'NIRIKSHAN API',
        description: 'Smart Real-Time Monitoring & Inspection Platform',
        version: '1.0.0',
        docs: `${env.API_PREFIX}/health`,
        frontend: adminWebDist
          ? 'Built and available (set NODE_ENV=production or SERVE_FRONTEND=true to serve)'
          : 'Not built (run npm run build:admin)',
      });
    });
  }

  // 9. 404 and Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

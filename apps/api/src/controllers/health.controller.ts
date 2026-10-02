import { Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database';
import { env } from '../config/env';
import { ApiResponse, HealthStatus } from '@nirikshan/shared-types';

export function getHealth(req: Request, res: Response<ApiResponse<HealthStatus>>): void {
  const dbStatus = getDatabaseStatus();
  const isHealthy = dbStatus === 'connected' || dbStatus === 'memory_fallback';

  const healthData: HealthStatus = {
    status: isHealthy ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    services: {
      database: {
        status: dbStatus,
      },
      aiService: {
        status: 'online',
        endpoint: env.AI_SERVICE_URL,
      },
      storage: {
        provider: env.STORAGE_PROVIDER,
        status: 'ready',
      },
    },
  };

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'NIRIKSHAN API Service is healthy and operational' : 'NIRIKSHAN API Service is degraded',
    data: healthData,
    meta: {
      requestId: req.id,
    },
  });
}

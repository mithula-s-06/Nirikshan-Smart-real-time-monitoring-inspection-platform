import { Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database';
import { env } from '../config/env';
import { ApiResponse, HealthStatus } from '@nirikshan/shared-types';
import { FaceVerificationService } from '../services/faceVerification.service';

export async function getHealth(req: Request, res: Response<ApiResponse<HealthStatus>>): Promise<void> {
  const dbStatus = getDatabaseStatus();
  const isDbHealthy = dbStatus === 'connected' || dbStatus === 'memory_fallback';

  // Live-probe the unified AI service
  const aiOnline = await FaceVerificationService.isHealthy();

  const isHealthy = isDbHealthy;

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
        status: aiOnline ? 'online' : 'offline',
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

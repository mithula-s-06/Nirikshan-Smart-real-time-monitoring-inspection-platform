import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.id = requestId;
  req.startTime = Date.now();

  res.setHeader('x-request-id', requestId);

  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());
    const statusCode = res.statusCode;

    const logData = {
      requestId,
      method,
      url: originalUrl,
      statusCode,
      durationMs: duration,
      ip,
      userAgent: req.get('user-agent'),
    };

    if (statusCode >= 500) {
      logger.error(logData, `HTTP ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else if (statusCode >= 400) {
      logger.warn(logData, `HTTP ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else {
      logger.info(logData, `HTTP ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    }
  });

  next();
}

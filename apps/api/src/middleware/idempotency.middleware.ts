import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { IdempotencyKey } from '../models/idempotencyKey.model';
import { logger } from '../utils/logger';

export function idempotencyMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

    if (!idempotencyKey || req.method === 'GET' || !req.user) {
      return next();
    }

    try {
      const requestPayload = JSON.stringify(req.body || {});
      const requestHash = crypto.createHash('sha256').update(requestPayload).digest('hex');

      const existingKey = await IdempotencyKey.findOne({ key: idempotencyKey });

      if (existingKey) {
        if (existingKey.requestHash !== requestHash) {
          res.status(409).json({
            success: false,
            error: {
              code: 'IDEMPOTENCY_KEY_MISMATCH',
              message:
                'Provided idempotency key has already been used with a differing request payload.',
              requestId: req.id,
            },
          });
          return;
        }

        logger.info(
          { key: idempotencyKey, statusCode: existingKey.responseStatusCode },
          '⚡ Returning cached idempotent replay response',
        );

        res.setHeader('x-idempotent-replay', 'true');
        res.status(existingKey.responseStatusCode).json(existingKey.responseBody);
        return;
      }

      // Intercept response to store upon successful completion
      const originalJson = res.json.bind(res);

      res.json = function (body: any): Response {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Hours

          IdempotencyKey.create({
            key: idempotencyKey,
            userId: req.user!.id,
            endpoint: req.originalUrl,
            requestHash,
            responseStatusCode: res.statusCode,
            responseBody: body,
            expiresAt,
          }).catch((err) => {
            logger.error({ err, key: idempotencyKey }, 'Failed to record idempotency key cache');
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error({ err: error, key: idempotencyKey }, 'Error in idempotency middleware');
      next();
    }
  };
}

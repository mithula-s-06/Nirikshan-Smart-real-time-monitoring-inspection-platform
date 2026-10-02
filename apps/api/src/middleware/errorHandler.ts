import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ApiErrorResponse } from '@nirikshan/shared-types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ApiErrorResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  const requestId = req.id;

  // 1. Handled AppError
  if (err instanceof AppError) {
    logger.warn(
      {
        requestId,
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        details: err.details,
      },
      `AppError: ${err.message}`,
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    logger.warn({ requestId, errors: formattedErrors }, 'Validation error');

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input provided',
        details: formattedErrors,
        requestId,
      },
    });
    return;
  }

  // 3. Mongoose Cast / Validation Errors
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID_FORMAT',
        message: 'Provided identifier is in an invalid format',
        requestId,
      },
    });
    return;
  }

  // 4. Unhandled / Unexpected Errors
  logger.error(
    {
      requestId,
      err: {
        message: err.message,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    },
    'Unhandled server error occurred',
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please contact the administrator.'
          : err.message || 'Internal Server Error',
      requestId,
    },
  });
}

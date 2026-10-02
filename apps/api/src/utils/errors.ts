export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed or token is invalid/expired', details?: unknown) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action', details?: unknown) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed for request data', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'The requested resource was not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'A resource conflict occurred', details?: unknown) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed or invalid file format', details?: unknown) {
    super(message, 400, 'FILE_UPLOAD_ERROR', details);
  }
}

export class GeoVerificationError extends AppError {
  constructor(message: string = 'GPS geo-verification failed. Inspector is outside required perimeter.', details?: unknown) {
    super(message, 400, 'GEO_VERIFICATION_ERROR', details);
  }
}

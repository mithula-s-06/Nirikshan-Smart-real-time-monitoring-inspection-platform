import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus, IUser } from '@nirikshan/shared-types';
import { verifyAccessToken } from '../services/token.service';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { User } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Authentication Middleware:
 * 1. Validates Bearer token in Authorization header
 * 2. Decodes JWT payload
 * 3. Verifies user exists in database and has ACTIVE status
 * 4. Attaches user object to req.user
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required. Missing Bearer token in Authorization header.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('Malformed Authorization token.');
    }

    const payload = verifyAccessToken(token);

    // Fetch user from DB to verify status hasn't been changed/suspended in real-time
    const user = await User.findById(payload.id);
    if (!user) {
      throw new AuthenticationError('The user account for this token no longer exists.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(`Account access denied. Your account status is: ${user.status}.`);
    }

    req.user = user.toJSON() as IUser;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control Middleware (RBAC):
 * Verifies that the authenticated user possesses at least one of the allowed roles.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required before checking role permissions.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Access forbidden. Role '${req.user.role}' is not authorized to access this resource. Required roles: [${allowedRoles.join(', ')}].`,
        ),
      );
    }

    next();
  };
}

/**
 * Account Status Verification Middleware
 */
export function requireStatus(...allowedStatuses: UserStatus[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required before checking account status.'));
    }

    if (!allowedStatuses.includes(req.user.status)) {
      return next(
        new AuthorizationError(
          `Access forbidden. User account status is '${req.user.status}'. Allowed statuses: [${allowedStatuses.join(', ')}].`,
        ),
      );
    }

    next();
  };
}

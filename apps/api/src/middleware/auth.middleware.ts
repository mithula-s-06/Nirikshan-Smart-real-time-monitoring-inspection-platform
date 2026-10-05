import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus, IUser, IDataScope, AuditAction } from '@nirikshan/shared-types';
import { verifyAccessToken } from '../services/token.service';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';
import { AuthorizationService } from '../services/authorization.service';
import { recordAudit } from '../services/audit.service';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      permissions?: string[];
      scope?: IDataScope;
      sessionId?: string;
      scopeFilter?: Record<string, any>;
    }
  }
}

/**
 * Authentication Middleware:
 * 1. Validates Bearer token in Authorization header
 * 2. Decodes JWT payload
 * 3. Verifies user exists in database and has ACTIVE status (not SUSPENDED / LOCKED)
 * 4. Checks active session validity
 * 5. Attaches user, permissions, and data scope to req
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

    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthorizationError('Account suspended by ministry administrator. Please contact DoSJE HQ.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(`Account access denied. Your account status is: ${user.status}.`);
    }

    // Check session validity (if token hash exists)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await Session.findOne({ tokenHash, isValid: true });
    if (session) {
      // Update last active
      session.lastActiveAt = new Date();
      await session.save();
      req.sessionId = session._id.toString();
    }

    const userJson = user.toJSON() as IUser;
    req.user = userJson;
    req.permissions = AuthorizationService.getUserPermissions(userJson);
    req.scope = AuthorizationService.resolveUserScope(userJson);

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Granular Permission-Based Authorization Middleware (resource.action)
 */
export function requirePermission(requiredPermission: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required before checking permissions.');
      }

      const hasPerm = AuthorizationService.hasPermission(req.user, requiredPermission);
      if (!hasPerm) {
        // Audit permission denial for security intelligence
        await recordAudit({
          actorId: req.user.id,
          actorEmail: req.user.email,
          actorRole: req.user.role,
          action: AuditAction.PERMISSION_DENIED,
          resource: requiredPermission,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          requestId: req.id,
          details: {
            requiredPermission,
            userRole: req.user.role,
            userPermissions: req.permissions,
            path: req.originalUrl,
            method: req.method,
          },
        });

        throw new AuthorizationError(
          `Access forbidden. Permission '${requiredPermission}' is required to perform this action.`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Apply Data Scope Middleware: computes MongoDB query filter for current user
 */
export function applyDataScope(
  resourceType: 'project' | 'institution' | 'inspection' | 'beneficiary' | 'financial' | 'anomaly' | 'compliance' | 'correctiveAction',
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required to resolve data scope.'));
    }

    req.scopeFilter = AuthorizationService.buildScopeFilter(req.user, resourceType);
    next();
  };
}

const ROLE_ALIASES: Record<string, string[]> = {
  SUPER_ADMIN: ['SYSTEM_SUPER_ADMIN', 'SUPER_ADMIN'],
  SYSTEM_SUPER_ADMIN: ['SUPER_ADMIN', 'SYSTEM_SUPER_ADMIN'],
  DEPARTMENT_OFFICIAL: ['DOSJE_HQ_OFFICIAL', 'DOSJE_HQ_ADMIN', 'DEPARTMENT_OFFICIAL'],
  DOSJE_HQ_OFFICIAL: ['DEPARTMENT_OFFICIAL', 'DOSJE_HQ_ADMIN', 'DOSJE_HQ_OFFICIAL'],
  DOSJE_HQ_ADMIN: ['DEPARTMENT_OFFICIAL', 'DOSJE_HQ_OFFICIAL', 'DOSJE_HQ_ADMIN'],
  STATE_AUTHORITY: ['DOSJE_STATE_OFFICIAL', 'STATE_AUTHORITY'],
  DOSJE_STATE_OFFICIAL: ['STATE_AUTHORITY', 'DOSJE_STATE_OFFICIAL'],
  DISTRICT_AUTHORITY: ['DOSJE_DISTRICT_OFFICIAL', 'DISTRICT_AUTHORITY'],
  DOSJE_DISTRICT_OFFICIAL: ['DISTRICT_AUTHORITY', 'DOSJE_DISTRICT_OFFICIAL'],
  PMU_OFFICER: ['PMU_MANAGER', 'PMU_OFFICER', 'DOSJE_HQ_OFFICIAL', 'SUPER_ADMIN'],
  INSPECTOR: ['PMU_INSPECTOR', 'INSPECTOR'],
  PMU_INSPECTOR: ['INSPECTOR', 'PMU_INSPECTOR'],
  NGO_ADMIN: ['INSTITUTE_ADMIN', 'NGO_ADMIN'],
  INSTITUTE_ADMIN: ['NGO_ADMIN', 'INSTITUTE_ADMIN'],
};

/**
 * Role-Based Access Control Middleware (RBAC) - Backwards compatible with persona hierarchy
 */
export function authorize(...allowedRoles: (UserRole | string)[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required before checking role permissions.'));
    }

    const userRoleStr = req.user.role as string;
    const isAllowed = allowedRoles.some((r) => {
      const allowedStr = r.toString();
      if (allowedStr === userRoleStr) return true;
      const aliases = ROLE_ALIASES[allowedStr] || [];
      return aliases.includes(userRoleStr);
    });

    if (!isAllowed) {
      return next(
        new AuthorizationError(
          `Access forbidden. Role '${req.user.role}' is not authorized. Required: [${allowedRoles.join(', ')}].`,
        ),
      );
    }

    next();
  };
}

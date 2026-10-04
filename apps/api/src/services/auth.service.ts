import { AuditAction, UserRole, UserStatus, IUser, IDataScope } from '@nirikshan/shared-types';
import { User, IUserDocument } from '../models/user.model';
import { Session } from '../models/session.model';
import { generateAuthTokens, rotateRefreshToken, revokeRefreshToken, AuthTokens } from './token.service';
import { recordAudit } from './audit.service';
import { AuthorizationService } from './authorization.service';
import { AuthenticationError, NotFoundError, ConflictError, ValidationError, AuthorizationError } from '../utils/errors';
import { CreateUserInput, LoginInput } from '@nirikshan/validation';
import crypto from 'crypto';

export interface AuthResult {
  user: IUser;
  roles: UserRole[];
  permissions: string[];
  scope: IDataScope;
  tokens: AuthTokens;
  session: {
    id: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  };
}

export class AuthService {
  /**
   * User login with official email & password, lockout protection, and session tracking
   */
  public static async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');

    if (!user) {
      await recordAudit({
        action: AuditAction.LOGIN_FAILED,
        resource: 'User',
        ipAddress,
        userAgent,
        requestId,
        details: { email: input.email, success: false, reason: 'USER_NOT_FOUND' },
      });
      throw new AuthenticationError('Invalid official email or password.');
    }

    // Check account lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / (60 * 1000));
      await recordAudit({
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        action: AuditAction.LOGIN_FAILED,
        resource: 'User',
        ipAddress,
        userAgent,
        requestId,
        details: { email: input.email, success: false, reason: 'ACCOUNT_LOCKED', remainingMinutes },
      });
      throw new AuthorizationError(
        `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      );
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      user.failedLoginAttempts = attempts;

      // Lock account after 5 consecutive failures
      if (attempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        user.failedLoginAttempts = 0;
      }
      await user.save();

      await recordAudit({
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        action: AuditAction.LOGIN_FAILED,
        resource: 'User',
        resourceId: user._id.toString(),
        ipAddress,
        userAgent,
        requestId,
        details: { email: input.email, success: false, reason: 'INVALID_PASSWORD', attempt: attempts },
      });
      throw new AuthenticationError('Invalid official email or password.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthorizationError('Account suspended by ministry administrator. Please contact DoSJE HQ.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(`Your account is currently ${user.status}. Please contact administrator.`);
    }

    // Reset failed login attempts on successful authentication
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = await generateAuthTokens(user, ipAddress, userAgent);

    // Create session in database
    const tokenHash = crypto.createHash('sha256').update(tokens.accessToken).digest('hex');
    const expiresAt = new Date(Date.now() + tokens.expiresInSeconds * 1000);
    const session = await Session.create({
      userId: user._id,
      tokenHash,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'Web Browser',
      deviceInfo: userAgent?.includes('Mobile') ? 'Mobile Device' : 'Desktop Station',
      lastActiveAt: new Date(),
      expiresAt,
      isValid: true,
    });

    const userJson = user.toJSON() as IUser;
    const permissions = AuthorizationService.getUserPermissions(userJson);
    const scope = AuthorizationService.resolveUserScope(userJson);

    // Audit log
    await recordAudit({
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      action: AuditAction.LOGIN,
      resource: 'User',
      resourceId: user._id.toString(),
      ipAddress,
      userAgent,
      requestId,
      details: { success: true, sessionId: session._id.toString(), scopeLevel: scope.level },
    });

    return {
      user: userJson,
      roles: [user.role],
      permissions,
      scope,
      tokens,
      session: {
        id: session._id.toString(),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: new Date(session.expiresAt),
      },
    };
  }

  /**
   * Refresh session tokens
   */
  public static async refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<AuthTokens> {
    const { tokens, user } = await rotateRefreshToken(refreshToken, ipAddress, userAgent);

    // Update or create new session entry
    const tokenHash = crypto.createHash('sha256').update(tokens.accessToken).digest('hex');
    await Session.create({
      userId: user._id,
      tokenHash,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'Web Browser',
      deviceInfo: userAgent?.includes('Mobile') ? 'Mobile Device' : 'Desktop Station',
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + tokens.expiresInSeconds * 1000),
      isValid: true,
    });

    await recordAudit({
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      action: AuditAction.TOKEN_REFRESH,
      resource: 'RefreshToken',
      ipAddress,
      userAgent,
      requestId,
      details: { success: true },
    });

    return tokens;
  }

  /**
   * User logout and session termination
   */
  public static async logout(
    refreshToken?: string,
    accessToken?: string,
    user?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<void> {
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    if (accessToken) {
      const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
      await Session.updateMany({ tokenHash }, { isValid: false, revokedAt: new Date(), revokedReason: 'USER_LOGOUT' });
    }

    if (user) {
      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: AuditAction.LOGOUT,
        resource: 'User',
        resourceId: user.id,
        ipAddress,
        userAgent,
        requestId,
        details: { success: true },
      });
    }
  }

  /**
   * Fetch current authenticated user identity and resolved permissions
   */
  public static async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }
    const userJson = user.toJSON() as IUser;
    const permissions = AuthorizationService.getUserPermissions(userJson);
    const scope = AuthorizationService.resolveUserScope(userJson);

    return {
      user: userJson,
      roles: [user.role],
      permissions,
      scope,
    };
  }

  /**
   * Get active sessions for user
   */
  public static async getActiveSessions(userId: string) {
    return Session.find({ userId, isValid: true }).sort({ lastActiveAt: -1 }).limit(10);
  }

  /**
   * Revoke a specific session
   */
  public static async revokeSession(userId: string, sessionId: string, actorId: string) {
    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new NotFoundError('Session not found.');
    }

    session.isValid = false;
    session.revokedAt = new Date();
    session.revokedReason = actorId === userId ? 'USER_TERMINATED' : 'ADMIN_REVOKED';
    await session.save();

    await recordAudit({
      actorId,
      action: AuditAction.SESSION_REVOKED,
      resource: 'Session',
      resourceId: sessionId,
      details: { targetUserId: userId },
    });

    return true;
  }

  /**
   * Create a new user (Admin / Authorized Officials)
   */
  public static async createUser(
    input: CreateUserInput,
    creator?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const user = await User.create({
      email: input.email.toLowerCase(),
      password: input.password,
      name: input.name,
      role: input.role,
      phoneNumber: input.phoneNumber,
      organizationId: input.organizationId,
      state: input.state,
      district: input.district,
      designation: (input as any).designation || 'Official',
      status: UserStatus.ACTIVE,
    });

    if (creator) {
      await recordAudit({
        actorId: creator.id,
        actorEmail: creator.email,
        actorRole: creator.role,
        action: AuditAction.USER_ROLE_CHANGED,
        resource: 'User',
        resourceId: user._id.toString(),
        ipAddress,
        userAgent,
        requestId,
        details: { createdUserEmail: user.email, assignedRole: user.role },
      });
    }

    return user.toJSON();
  }
}

import { AuditAction, UserRole, UserStatus } from '@nirikshan/shared-types';
import { User, IUserDocument } from '../models/user.model';
import { generateAuthTokens, rotateRefreshToken, revokeRefreshToken, AuthTokens } from './token.service';
import { recordAudit } from './audit.service';
import { AuthenticationError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { CreateUserInput, LoginInput } from '@nirikshan/validation';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    phoneNumber?: string;
    role: UserRole;
    status: UserStatus;
    organizationId?: string;
    state?: string;
    district?: string;
    avatarUrl?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  tokens: AuthTokens;
}

export class AuthService {
  /**
   * User login with email & password
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
        action: AuditAction.LOGIN,
        resource: 'User',
        ipAddress,
        userAgent,
        requestId,
        details: { email: input.email, success: false, reason: 'USER_NOT_FOUND' },
      });
      throw new AuthenticationError('Invalid email or password.');
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
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
        details: { email: input.email, success: false, reason: 'INVALID_PASSWORD' },
      });
      throw new AuthenticationError('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(`Your account is currently ${user.status}. Please contact administrator.`);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = await generateAuthTokens(user, ipAddress, userAgent);

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
      details: { success: true },
    });

    return {
      user: user.toJSON() as any,
      tokens,
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
   * User logout and token revocation
   */
  public static async logout(
    refreshToken?: string,
    user?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<void> {
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
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
   * Fetch current authenticated user profile
   */
  public static async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }
    return user.toJSON();
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

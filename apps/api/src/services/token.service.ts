import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { UserRole, UserStatus } from '@nirikshan/shared-types';
import { env } from '../config/env';
import { RefreshToken } from '../models/refreshToken.model';
import { AuthenticationError } from '../utils/errors';
import { IUserDocument, User } from '../models/user.model';
import { logger } from '../utils/logger';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
}

// Convert "15m", "7d", etc. to seconds
export function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 mins
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return val;
    case 'm':
      return val * 60;
    case 'h':
      return val * 3600;
    case 'd':
      return val * 86400;
    default:
      return 900;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION as any,
  });
}

export function signRefreshToken(payload: { id: string }): string {
  return jwt.sign(
    {
      id: payload.id,
      jti: crypto.randomUUID(), // Guarantee unique token even when issued in same second
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRATION as any,
    },
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Access token has expired. Please refresh your session.');
    }
    throw new AuthenticationError('Invalid access token provided.');
  }
}

export function verifyRefreshToken(token: string): { id: string } {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token has expired. Please login again.');
    }
    throw new AuthenticationError('Invalid refresh token.');
  }
}

export async function generateAuthTokens(
  user: IUserDocument,
  ipAddress?: string,
  userAgent?: string,
): Promise<AuthTokens> {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
    organizationId: user.organizationId ? user.organizationId.toString() : undefined,
  };

  const accessToken = signAccessToken(payload);
  const rawRefreshToken = signRefreshToken({ id: payload.id });
  const tokenHash = hashToken(rawRefreshToken);

  const refreshExpirySeconds = parseDurationToSeconds(env.JWT_REFRESH_EXPIRATION);
  const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);

  // Store refresh token document in database
  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    isRevoked: false,
    ipAddress,
    userAgent,
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    tokenType: 'Bearer',
    expiresInSeconds: parseDurationToSeconds(env.JWT_ACCESS_EXPIRATION),
  };
}

export async function rotateRefreshToken(
  rawRefreshToken: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ tokens: AuthTokens; user: IUserDocument }> {
  const decoded = verifyRefreshToken(rawRefreshToken);
  const tokenHash = hashToken(rawRefreshToken);

  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    throw new AuthenticationError('Invalid refresh token session. Please login again.');
  }

  // Token Reuse / Replay Attack Detection
  if (tokenDoc.isRevoked) {
    logger.warn(
      { userId: decoded.id, ipAddress },
      '🚨 SECURITY ALERT: Revoked refresh token reuse attempted. Invalidating all sessions for this user.',
    );
    // Revoke all tokens for this user for security
    await RefreshToken.updateMany({ userId: tokenDoc.userId }, { isRevoked: true, revokedAt: new Date() });
    throw new AuthenticationError('Security violation detected. All active sessions have been terminated. Please re-login.');
  }

  // Fetch active user
  const user = await User.findById(tokenDoc.userId);
  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new AuthenticationError('User account is inactive or not found.');
  }

  // Revoke the old refresh token
  tokenDoc.isRevoked = true;
  tokenDoc.revokedAt = new Date();

  // Generate new tokens
  const newTokens = await generateAuthTokens(user, ipAddress, userAgent);
  tokenDoc.replacedByToken = hashToken(newTokens.refreshToken);
  await tokenDoc.save();

  return { tokens: newTokens, user };
}

export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash },
    { isRevoked: true, revokedAt: new Date() },
  );
}

export async function revokeAllUserTokens(userId: string | mongoose.Types.ObjectId): Promise<void> {
  await RefreshToken.updateMany(
    { userId },
    { isRevoked: true, revokedAt: new Date() },
  );
}

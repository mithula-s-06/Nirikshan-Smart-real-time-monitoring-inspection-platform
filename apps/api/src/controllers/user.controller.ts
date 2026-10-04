import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';
import { recordAudit } from '../services/audit.service';
import { AuditAction, UserStatus, UserRole, ApiResponse } from '@nirikshan/shared-types';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';

export class UserController {
  /**
   * GET /api/v1/users - List users with scope filtering
   */
  public static async listUsers(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const scopeFilter: Record<string, any> = {};

      // State officials only see users in their state
      if (req.user?.role === UserRole.DOSJE_STATE_OFFICIAL || req.user?.role === UserRole.STATE_AUTHORITY) {
        scopeFilter.state = req.user.state;
      }
      // District officials only see users in their district
      if (req.user?.role === UserRole.DOSJE_DISTRICT_OFFICIAL || req.user?.role === UserRole.DISTRICT_AUTHORITY) {
        scopeFilter.state = req.user.state;
        scopeFilter.district = req.user.district;
      }

      const users = await User.find(scopeFilter).sort({ createdAt: -1 }).limit(100);

      res.status(200).json({
        success: true,
        message: 'Users retrieved',
        data: users,
        meta: { requestId: req.id, total: users.length },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   */
  public static async getUserById(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw new NotFoundError('User not found.');

      res.status(200).json({
        success: true,
        data: user,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id/role - Controlled role and scope assignment
   */
  public static async assignRole(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { role, state, district, organizationId, reason } = req.body;
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw new NotFoundError('User not found.');

      const previousRole = targetUser.role;
      targetUser.role = role || targetUser.role;
      if (state !== undefined) targetUser.state = state;
      if (district !== undefined) targetUser.district = district;
      if (organizationId !== undefined) targetUser.organizationId = organizationId;

      await targetUser.save();

      // Audit role and scope modification
      await recordAudit({
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        action: AuditAction.USER_ROLE_CHANGED,
        resource: 'User',
        resourceId: targetUser._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
        details: {
          targetEmail: targetUser.email,
          previousRole,
          newRole: targetUser.role,
          state: targetUser.state,
          district: targetUser.district,
          reason: reason || 'Administrative Role Reassignment',
        },
      });

      res.status(200).json({
        success: true,
        message: `Role successfully updated to ${targetUser.role}`,
        data: targetUser,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id/suspend - Suspend user & revoke all active sessions immediately
   */
  public static async suspendUser(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw new NotFoundError('User not found.');

      targetUser.status = UserStatus.SUSPENDED;
      await targetUser.save();

      // Revoke all active sessions immediately (forces real-time disconnect!)
      await Session.updateMany(
        { userId: targetUser._id, isValid: true },
        { isValid: false, revokedAt: new Date(), revokedReason: `ACCOUNT_SUSPENDED: ${reason || 'Administrative action'}` },
      );

      await recordAudit({
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        action: AuditAction.USER_SUSPENDED,
        resource: 'User',
        resourceId: targetUser._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
        details: { targetEmail: targetUser.email, reason: reason || 'Violation of compliance policy' },
      });

      res.status(200).json({
        success: true,
        message: `User ${targetUser.email} has been suspended and all sessions revoked.`,
        data: targetUser,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id/reactivate - Reactivate suspended user
   */
  public static async reactivateUser(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw new NotFoundError('User not found.');

      targetUser.status = UserStatus.ACTIVE;
      targetUser.failedLoginAttempts = 0;
      targetUser.lockoutUntil = undefined;
      await targetUser.save();

      await recordAudit({
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        action: AuditAction.USER_REACTIVATED,
        resource: 'User',
        resourceId: targetUser._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
        details: { targetEmail: targetUser.email },
      });

      res.status(200).json({
        success: true,
        message: `User ${targetUser.email} reactivated.`,
        data: targetUser,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/:id/temporary-access - Grant time-limited elevated jurisdiction
   */
  public static async grantTemporaryAccess(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { role, scope, effectiveFrom, effectiveUntil, reason } = req.body;
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw new NotFoundError('User not found.');

      targetUser.temporaryAccess = {
        role,
        scope,
        effectiveFrom: new Date(effectiveFrom),
        effectiveUntil: new Date(effectiveUntil),
        reason,
        approvedBy: req.user?.name || req.user?.email || 'DoSJE Administrator',
      };
      await targetUser.save();

      await recordAudit({
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        action: AuditAction.SCOPE_MODIFIED,
        resource: 'User',
        resourceId: targetUser._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
        details: {
          targetEmail: targetUser.email,
          elevatedRole: role,
          effectiveUntil,
          reason,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Temporary elevated access granted successfully.',
        data: targetUser,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }
}

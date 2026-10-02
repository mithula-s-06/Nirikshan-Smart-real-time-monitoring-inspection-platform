import { AuditAction, UserRole } from '@nirikshan/shared-types';
import { AuditLog } from '../models/auditLog.model';
import { logger } from '../utils/logger';

export interface AuditLogInput {
  actorId?: string;
  actorEmail?: string;
  actorRole?: UserRole;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

export async function recordAudit(input: AuditLogInput): Promise<void> {
  try {
    await AuditLog.create({
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      requestId: input.requestId,
      details: input.details || {},
      timestamp: new Date(),
    });
  } catch (err: any) {
    // Non-blocking log so an audit write failure does not break critical user paths, but is captured
    logger.error({ err, auditInput: input }, 'Failed to write audit log entry');
  }
}

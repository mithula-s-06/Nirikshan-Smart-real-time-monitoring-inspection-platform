import { Server } from 'socket.io';
import { SocketEvent, UserRole, IInspection, IEvidence, IAnomalyAlert } from '@nirikshan/shared-types';
import { logger } from '../utils/logger';

class RealtimeEmitter {
  private io: Server | null = null;

  public setServer(io: Server): void {
    this.io = io;
  }

  public getServer(): Server | null {
    return this.io;
  }

  public emitToUser(userId: string, event: SocketEvent | string, data: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToRole(role: UserRole | string, event: SocketEvent | string, data: unknown): void {
    if (!this.io) return;
    this.io.to(`role:${role}`).emit(event, data);
  }

  public emitToInspection(inspectionId: string, event: SocketEvent | string, data: unknown): void {
    if (!this.io) return;
    this.io.to(`inspection:${inspectionId}`).emit(event, data);
  }

  public emitToAll(event: SocketEvent | string, data: unknown): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  public emitInspectionAssigned(inspection: IInspection | any): void {
    const inspectorId = inspection.inspectorId?.toString() || inspection.assignedTo?.id;
    logger.info({ inspectionId: inspection.id, inspectorId }, '📢 Emitting inspection:assigned event');

    this.emitToUser(inspectorId, SocketEvent.INSPECTION_ASSIGNED, {
      inspection,
      message: `New inspection mission assigned: ${inspection.inspectionId || inspection.code}`,
      timestamp: new Date(),
    });

    this.emitToRole(UserRole.SUPER_ADMIN, SocketEvent.INSPECTION_ASSIGNED, {
      inspection,
      timestamp: new Date(),
    });

    this.emitToRole(UserRole.DEPARTMENT_OFFICIAL, SocketEvent.INSPECTION_ASSIGNED, {
      inspection,
      timestamp: new Date(),
    });
  }

  public emitInspectionStatusChanged(
    inspection: IInspection | any,
    oldStatus: string,
    newStatus: string,
  ): void {
    logger.info(
      { inspectionId: inspection.id, oldStatus, newStatus },
      '📢 Emitting inspection:status_changed event',
    );

    const payload = {
      inspectionId: inspection.id || inspection._id,
      inspectionCode: inspection.inspectionId || inspection.code,
      oldStatus,
      newStatus,
      updatedAt: new Date(),
      inspection,
    };

    this.emitToInspection(inspection.id || inspection._id, SocketEvent.INSPECTION_STATUS_CHANGED, payload);
    this.emitToRole(UserRole.SUPER_ADMIN, SocketEvent.INSPECTION_STATUS_CHANGED, payload);
    this.emitToRole(UserRole.DEPARTMENT_OFFICIAL, SocketEvent.INSPECTION_STATUS_CHANGED, payload);
    this.emitToRole(UserRole.PMU_OFFICER, SocketEvent.INSPECTION_STATUS_CHANGED, payload);
  }

  public emitEvidenceUploaded(inspectionId: string, evidence: IEvidence | any): void {
    logger.info({ inspectionId, evidenceId: evidence.id }, '📢 Emitting evidence:uploaded event');
    this.emitToInspection(inspectionId, SocketEvent.EVIDENCE_UPLOADED, {
      inspectionId,
      evidence,
      timestamp: new Date(),
    });
  }

  public emitAlertCreated(alert: IAnomalyAlert | any): void {
    logger.warn({ alertId: alert.id, severity: alert.severity }, '🚨 Emitting alert:created event');
    this.emitToRole(UserRole.SUPER_ADMIN, SocketEvent.ALERT_CREATED, { alert, timestamp: new Date() });
    this.emitToRole(UserRole.DEPARTMENT_OFFICIAL, SocketEvent.ALERT_CREATED, { alert, timestamp: new Date() });
  }

  public emitDashboardMetricsUpdate(metrics: Record<string, unknown>): void {
    this.emitToRole(UserRole.SUPER_ADMIN, SocketEvent.DASHBOARD_UPDATE, { metrics, timestamp: new Date() });
    this.emitToRole(UserRole.DEPARTMENT_OFFICIAL, SocketEvent.DASHBOARD_UPDATE, { metrics, timestamp: new Date() });
  }
}

export const emitter = new RealtimeEmitter();

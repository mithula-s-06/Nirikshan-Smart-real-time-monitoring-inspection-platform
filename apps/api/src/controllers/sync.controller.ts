import { Request, Response, NextFunction } from 'express';
import { SyncService } from '../services/sync.service';
import { syncPullSchema, syncPushSchema } from '@nirikshan/validation';

export class SyncController {
  /**
   * GET /api/v1/sync/pull
   * Pulls delta updates, active inspections, and checklist templates for offline storage
   */
  public static async pull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = syncPullSchema.parse(req.query);
      const inspectorId = req.user!.id;

      const syncPackage = await SyncService.pullSyncPackage(
        inspectorId,
        validatedQuery.lastSyncTimestamp,
      );

      res.status(200).json({
        success: true,
        message: 'Sync delta package retrieved successfully',
        data: syncPackage,
        meta: {
          inspectionsCount: syncPackage.assignedInspections.length,
          projectsCount: syncPackage.projects.length,
          checklistsCount: syncPackage.checklistTemplates.length,
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sync/push
   * Pushes a batch of offline actions recorded during field inspections
   */
  public static async push(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = syncPushSchema.parse(req.body);
      const inspectorId = req.user!.id;

      const pushResult = await SyncService.processSyncBatch(
        inspectorId,
        {
          inspectorId,
          syncBatchId: validatedBody.syncBatchId,
          actions: validatedBody.actions,
        },
        req.ip,
        req.get('user-agent'),
      );

      res.status(200).json({
        success: true,
        message: `Processed ${pushResult.processedCount} sync actions: ${pushResult.successCount} succeeded, ${pushResult.failureCount} failed.`,
        data: pushResult,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }
}

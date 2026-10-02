import { Request, Response, NextFunction } from 'express';
import { AiAnomalyService } from '../services/aiAnomaly.service';
import {
  analyzeAttendanceSchema,
  analyzeProgressVelocitySchema,
  analyzeDuplicateEvidenceSchema,
  updateAlertStatusSchema,
  getAlertsQuerySchema,
} from '@nirikshan/validation';

export class AnomalyController {
  public static async analyzeAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = analyzeAttendanceSchema.parse(req.body);
      const result = await AiAnomalyService.analyzeAttendance(validatedInput, (req as any).user);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async analyzeProgressVelocity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = analyzeProgressVelocitySchema.parse(req.body);
      const result = await AiAnomalyService.analyzeProgressVelocity(validatedInput, (req as any).user);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async analyzeDuplicateEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = analyzeDuplicateEvidenceSchema.parse(req.body);
      const result = await AiAnomalyService.analyzeDuplicateEvidence(validatedInput, (req as any).user);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = getAlertsQuerySchema.parse(req.query);
      const result = await AiAnomalyService.getAlerts(validatedQuery as any);
      res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAlertById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alert = await AiAnomalyService.getAlertById(req.params.id);
      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateAlertStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = updateAlertStatusSchema.parse(req.body);
      const updated = await AiAnomalyService.updateAlertStatus(
        req.params.id,
        validatedInput,
        (req as any).user,
      );
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

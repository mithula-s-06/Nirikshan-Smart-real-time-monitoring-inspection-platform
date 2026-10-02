import { Request, Response, NextFunction } from 'express';
import { ChecklistService } from '../services/checklist.service';
import { ApiResponse } from '@nirikshan/shared-types';

export class ChecklistController {
  public static async create(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const template = await ChecklistService.createTemplate(req.body);
      res.status(201).json({
        success: true,
        message: 'Checklist template created successfully',
        data: { template },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { scheme } = req.query as { scheme?: string };
      const templates = await ChecklistService.getTemplates(scheme);
      res.status(200).json({
        success: true,
        data: { templates },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const template = await ChecklistService.getTemplateById(req.params.id);
      res.status(200).json({
        success: true,
        data: { template },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }
}

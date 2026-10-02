import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organization.service';
import { ApiResponse } from '@nirikshan/shared-types';

export class OrganizationController {
  public static async create(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.createOrganization(
        req.body,
        req.user,
        req.ip,
        req.get('user-agent'),
        req.id,
      );

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: { organization: org },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const result = await OrganizationService.getOrganizations(req.query);

      res.status(200).json({
        success: true,
        message: 'Organizations retrieved successfully',
        data: { organizations: result.items },
        meta: {
          ...result.meta,
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.getOrganizationById(req.params.id);

      res.status(200).json({
        success: true,
        data: { organization: org },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.updateOrganization(
        req.params.id,
        req.body,
        req.user,
        req.ip,
        req.get('user-agent'),
        req.id,
      );

      res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: { organization: org },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }
}

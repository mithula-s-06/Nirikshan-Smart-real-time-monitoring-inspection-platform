import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { ApiResponse } from '@nirikshan/shared-types';
import { AuthorizationService } from '../services/authorization.service';
import { AuthorizationError } from '../utils/errors';

export class ProjectController {
  public static async create(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.createProject(
        req.body,
        req.user,
        req.ip,
        req.get('user-agent'),
        req.id,
      );

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const scopeFilter = req.user ? AuthorizationService.buildScopeFilter(req.user, 'project') : {};
      const result = await ProjectService.getProjects(req.query, scopeFilter);

      res.status(200).json({
        success: true,
        message: 'Projects retrieved successfully',
        data: { projects: result.items },
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
      const project = await ProjectService.getProjectById(req.params.id);

      // Object-Level Authorization Check (Prevents IDOR)
      if (req.user && !AuthorizationService.canAccessObject(req.user, project, 'project')) {
        throw new AuthorizationError('Access forbidden. This project is outside your authorized jurisdiction/scope.');
      }

      res.status(200).json({
        success: true,
        data: { project },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.updateProject(
        req.params.id,
        req.body,
        req.user,
        req.ip,
        req.get('user-agent'),
        req.id,
      );

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: { project },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getNearby(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { longitude, latitude, maxDistanceMeters, limit } = req.query as any;

      const projects = await ProjectService.getNearbyProjects(
        Number(longitude),
        Number(latitude),
        maxDistanceMeters ? Number(maxDistanceMeters) : 50000,
        limit ? Number(limit) : 20,
      );

      res.status(200).json({
        success: true,
        message: `Found ${projects.length} projects nearby`,
        data: { projects },
        meta: {
          total: projects.length,
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStats(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const stats = await ProjectService.getProjectStats();

      res.status(200).json({
        success: true,
        data: { stats },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }
}

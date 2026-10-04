import { Request, Response, NextFunction } from 'express';
import { InspectionService } from '../services/inspection.service';
import { InspectionAssignmentService } from '../services/inspectionAssignment.service';
import { ApiResponse } from '@nirikshan/shared-types';

export class InspectionController {
  public static async create(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const inspection = await InspectionService.createInspection(
        req.body,
        req.user,
        req.ip,
        req.get('user-agent'),
        req.id,
      );

      res.status(201).json({
        success: true,
        message: 'Inspection created and assigned successfully',
        data: { inspection },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async autoAssign(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const result = await InspectionAssignmentService.generateAssignments({
        ...req.body,
        assignedByUserId: req.user?.id,
      });

      res.status(201).json({
        success: true,
        message: `Successfully generated ${result.count} inspection assignments via weighted random assignment engine`,
        data: result,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const query = { ...(req.query as any) };
      // Scope enforcement: Field inspectors only see their assigned inspections
      if (req.user?.role === 'INSPECTOR' || req.user?.role === 'PMU_INSPECTOR') {
        query.inspectorId = req.user.id;
      }
      const result = await InspectionService.getInspections(query);

      res.status(200).json({
        success: true,
        data: { inspections: result.items },
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
      const inspection = await InspectionService.getInspectionById(req.params.id);

      res.status(200).json({
        success: true,
        data: { inspection },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async accept(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const inspection = await InspectionService.acceptInspection(req.params.id, req.user!);

      res.status(200).json({
        success: true,
        message: 'Inspection accepted',
        data: { inspection },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async enRoute(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const inspection = await InspectionService.enRouteInspection(req.params.id, req.user!);

      res.status(200).json({
        success: true,
        message: 'Inspector marked en route to site',
        data: { inspection },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async arrive(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { coordinates, accuracyMeters } = req.body;
      const result = await InspectionService.arriveInspection(req.params.id, coordinates, accuracyMeters, req.user!);

      res.status(200).json({
        success: true,
        message: 'Inspector arrival logged and GPS location checked',
        data: result,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async start(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { coordinates, accuracyMeters } = req.body;
      const result = await InspectionService.startInspection(req.params.id, coordinates, accuracyMeters, req.user!);

      res.status(200).json({
        success: true,
        message: 'GPS verification successful. Inspection is now in progress.',
        data: result,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async submit(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const inspection = await InspectionService.submitInspection(req.params.id, req.body, req.user!);

      res.status(200).json({
        success: true,
        message: 'Inspection report submitted successfully for review',
        data: { inspection },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async review(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const inspection = await InspectionService.reviewInspection(req.params.id, req.body, req.user!);

      res.status(200).json({
        success: true,
        message: `Inspection review recorded: ${req.body.decision}`,
        data: { inspection },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }
}

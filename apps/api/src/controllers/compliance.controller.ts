import { Request, Response } from 'express';
import { ComplianceRecord } from '../models/complianceRecord.model';
import { ApiResponse } from '@nirikshan/shared-types';

export class ComplianceController {
  public static async getComplianceRecords(req: Request, res: Response): Promise<void> {
    try {
      const { state, status, actionType, search, limit = '100', page = '1' } = req.query;
      const query: Record<string, any> = {};

      if (state) query.state = state;
      if (status) query.currentStatus = status;
      if (actionType) query.actionType = actionType;
      if (search) {
        query.$or = [
          { ngoName: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } },
          { orderNumber: { $regex: search as string, $options: 'i' } },
        ];
      }

      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200);
      const pageNum = parseInt(page as string, 10) || 1;
      const skip = (pageNum - 1) * limitNum;

      const [records, total] = await Promise.all([
        ComplianceRecord.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        ComplianceRecord.countDocuments(query),
      ]);

      const stats = {
        totalRecords: total,
        blacklisted: await ComplianceRecord.countDocuments({ currentStatus: 'BLACKLISTED' }),
        grantSuspended: await ComplianceRecord.countDocuments({ currentStatus: 'GRANT_SUSPENDED' }),
        underReview: await ComplianceRecord.countDocuments({ currentStatus: 'UNDER_REVIEW' }),
        actionRequired: await ComplianceRecord.countDocuments({ currentStatus: 'ACTION_REQUIRED' }),
      };

      const response: ApiResponse<any> = {
        success: true,
        data: {
          records,
          stats,
        },
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  public static async getComplianceRecordById(req: Request, res: Response): Promise<void> {
    try {
      const record = await ComplianceRecord.findById(req.params.id);
      if (!record) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Compliance record not found' } });
        return;
      }
      res.status(200).json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}

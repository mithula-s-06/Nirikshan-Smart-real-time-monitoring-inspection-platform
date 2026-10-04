import { Request, Response } from 'express';
import { Beneficiary } from '../models/beneficiary.model';
import { ApiResponse } from '@nirikshan/shared-types';
import { AuthorizationService } from '../services/authorization.service';

export class BeneficiaryController {
  public static async getBeneficiaries(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, unitId, eligibilityStatus, verificationStatus, riskLevel, search, limit = '100', page = '1' } = req.query;
      const scopeFilter = req.user ? AuthorizationService.buildScopeFilter(req.user, 'beneficiary') : {};
      const query: Record<string, any> = { ...scopeFilter };

      if (projectId) query.projectId = projectId;
      if (unitId) query.unitId = unitId;
      if (eligibilityStatus) query.eligibilityStatus = eligibilityStatus;
      if (verificationStatus) query.verificationStatus = verificationStatus;
      if (riskLevel) query.riskLevel = riskLevel;
      if (search) {
        query.$or = [
          { name: { $regex: search as string, $options: 'i' } },
          { beneficiaryId: { $regex: search as string, $options: 'i' } },
          { guardianName: { $regex: search as string, $options: 'i' } },
        ];
      }

      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200);
      const pageNum = parseInt(page as string, 10) || 1;
      const skip = (pageNum - 1) * limitNum;

      const [beneficiaries, total] = await Promise.all([
        Beneficiary.find(query)
          .populate('projectId', 'name code scheme')
          .populate('organizationId', 'name code state district')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        Beneficiary.countDocuments(query),
      ]);

      const stats = {
        total,
        verified: await Beneficiary.countDocuments({ verificationStatus: 'VERIFIED' }),
        failed: await Beneficiary.countDocuments({ verificationStatus: 'FAILED' }),
        pending: await Beneficiary.countDocuments({ verificationStatus: 'PENDING' }),
        highRisk: await Beneficiary.countDocuments({ riskLevel: 'HIGH' }),
        eligible: await Beneficiary.countDocuments({ eligibilityStatus: 'ELIGIBLE' }),
        underReview: await Beneficiary.countDocuments({ eligibilityStatus: 'UNDER_REVIEW' }),
      };

      const response: ApiResponse<any> = {
        success: true,
        data: {
          beneficiaries,
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

  public static async getBeneficiaryById(req: Request, res: Response): Promise<void> {
    try {
      const beneficiary = await Beneficiary.findById(req.params.id)
        .populate('projectId')
        .populate('organizationId');

      if (!beneficiary) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Beneficiary not found' } });
        return;
      }

      res.status(200).json({ success: true, data: beneficiary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  public static async getBeneficiaryByCode(req: Request, res: Response): Promise<void> {
    try {
      const beneficiary = await Beneficiary.findOne({ beneficiaryId: req.params.code })
        .populate('projectId')
        .populate('organizationId');

      if (!beneficiary) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Beneficiary not found' } });
        return;
      }

      res.status(200).json({ success: true, data: beneficiary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}

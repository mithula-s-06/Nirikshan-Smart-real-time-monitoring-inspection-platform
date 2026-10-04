import { Request, Response } from 'express';
import { CorrectiveAction } from '../models/correctiveAction.model';
import { ApiResponse } from '@nirikshan/shared-types';

export class CorrectiveActionController {
  public static async getActions(req: Request, res: Response): Promise<void> {
    try {
      const { status, priority, organizationId } = req.query;
      const query: Record<string, any> = {};

      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (organizationId) query.organizationId = organizationId;

      const actions = await CorrectiveAction.find(query)
        .populate('organizationId', 'name code state district')
        .populate('projectId', 'name code scheme')
        .sort({ deadline: 1 });

      const stats = {
        total: await CorrectiveAction.countDocuments(),
        open: await CorrectiveAction.countDocuments({ status: 'OPEN' }),
        inProgress: await CorrectiveAction.countDocuments({ status: 'IN_PROGRESS' }),
        overdue: await CorrectiveAction.countDocuments({ status: 'OVERDUE' }),
        submitted: await CorrectiveAction.countDocuments({ status: 'SUBMITTED' }),
        verified: await CorrectiveAction.countDocuments({ status: 'VERIFIED' }),
        closed: await CorrectiveAction.countDocuments({ status: 'CLOSED' }),
      };

      const response: ApiResponse<any> = {
        success: true,
        data: {
          actions,
          stats,
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  public static async createAction(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        responsibleAuthority,
        organizationId,
        projectId,
        anomalyId,
        deadline,
        priority,
        evidenceRequired,
        officerRemarks,
      } = req.body;

      const actionCount = await CorrectiveAction.countDocuments();
      const actionNumber = `CA-2026-${String(actionCount + 1).padStart(3, '0')}`;

      const action = new CorrectiveAction({
        actionNumber,
        title,
        description,
        responsibleAuthority,
        organizationId,
        projectId,
        anomalyId,
        deadline: new Date(deadline),
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        evidenceRequired,
        officerRemarks,
        assignedOfficerId: (req as any).user?.id,
      });

      await action.save();
      res.status(201).json({ success: true, data: action });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  public static async updateActionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, officerRemarks, submittedEvidenceIds } = req.body;

      const updateData: Record<string, any> = { status };
      if (officerRemarks) updateData.officerRemarks = officerRemarks;
      if (submittedEvidenceIds) updateData.submittedEvidenceIds = submittedEvidenceIds;
      if (status === 'VERIFIED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }

      const action = await CorrectiveAction.findByIdAndUpdate(id, updateData, { new: true });
      if (!action) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Action not found' } });
        return;
      }

      res.status(200).json({ success: true, data: action });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}

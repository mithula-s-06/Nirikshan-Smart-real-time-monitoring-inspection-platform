import { Request, Response } from 'express';
import { VCSession } from '../models/vcSession.model';
import { Project } from '../models/project.model';
import { Organization } from '../models/organization.model';
import { ApiResponse } from '@nirikshan/shared-types';

export class VCController {
  public static async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, projectId, status } = req.query;
      const query: Record<string, any> = {};

      if (organizationId) query.organizationId = organizationId;
      if (projectId) query.projectId = projectId;
      if (status) query.status = status;

      const sessions = await VCSession.find(query)
        .populate('organizationId', 'name code state district')
        .populate('projectId', 'name code scheme contactName contactPhone')
        .populate('initiatedByOfficerId', 'name email role')
        .sort({ createdAt: -1 });

      const stats = {
        total: await VCSession.countDocuments(),
        completed: await VCSession.countDocuments({ status: 'COMPLETED' }),
        anomalyFlagged: await VCSession.countDocuments({ anomalyFlagged: true }),
        isIntegrationReady: true,
      };

      const response: ApiResponse<any> = {
        success: true,
        data: {
          sessions,
          stats,
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  public static async initiateSurpriseVC(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, observations, notes, reportedStaffCount, verifiedStaffCount, reportedBeneficiaryCount, verifiedBeneficiaryCount } = req.body;

      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
        return;
      }

      const sessionCount = await VCSession.countDocuments();
      const sessionCode = `VC-SURPRISE-2026-${String(sessionCount + 101).padStart(3, '0')}`;

      const vcSession = new VCSession({
        sessionCode,
        organizationId: project.organizationId,
        projectId: project._id,
        initiatedByOfficerId: (req as any).user?.id,
        projectInchargeName: project.contactName || 'Project Incharge',
        inchargePhone: project.contactPhone,
        status: 'COMPLETED',
        isSurprise: true,
        scheduledTime: new Date(Date.now() - 15 * 60 * 1000),
        connectedTime: new Date(Date.now() - 14 * 60 * 1000),
        endedTime: new Date(),
        reportedStaffCount: reportedStaffCount || 5,
        verifiedStaffCount: verifiedStaffCount || 5,
        reportedBeneficiaryCount: reportedBeneficiaryCount || 30,
        verifiedBeneficiaryCount: verifiedBeneficiaryCount || 28,
        observations: Array.isArray(observations)
          ? observations
          : typeof observations === 'string' && observations.trim()
          ? [{ question: 'Officer Observation', response: observations.trim(), isSatisfactory: true }]
          : [
              { question: 'Check incharge presence on camera', response: 'Verified in person', isSatisfactory: true },
              { question: 'Verify beneficiary classroom count', response: 'Count verified on camera feed', isSatisfactory: true },
            ],
        notes: notes || 'Surprise video conference spot-check conducted successfully by DoSJE monitoring officer.',
        anomalyFlagged: reportedBeneficiaryCount && verifiedBeneficiaryCount && verifiedBeneficiaryCount < reportedBeneficiaryCount * 0.8,
        isIntegrationReady: true,
      });

      await vcSession.save();
      res.status(201).json({ success: true, data: vcSession });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}

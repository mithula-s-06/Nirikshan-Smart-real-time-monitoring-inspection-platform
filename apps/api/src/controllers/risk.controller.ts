import { Request, Response } from 'express';
import { Project } from '../models/project.model';
import { AnomalyAlert } from '../models/anomalyAlert.model';
import { FinancialRecord } from '../models/financialRecord.model';
import { ComplianceRecord } from '../models/complianceRecord.model';
import { Beneficiary } from '../models/beneficiary.model';
import { CorrectiveAction } from '../models/correctiveAction.model';
import { IRiskScoreBreakdown, RiskLevel, ApiResponse } from '@nirikshan/shared-types';

export class RiskController {
  public static async calculateProjectRisk(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const project = await Project.findById(projectId).populate('organizationId');
      if (!project) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
        return;
      }

      // 1. Beneficiary Integrity Sub-Score (Max 30)
      const benFactors: string[] = [];
      let benScore = 5;
      const highRiskBens = await Beneficiary.countDocuments({ projectId, riskLevel: 'HIGH' });
      const failedBens = await Beneficiary.countDocuments({ projectId, verificationStatus: 'FAILED' });

      if (highRiskBens > 0) {
        benScore += Math.min(15, highRiskBens * 7);
        benFactors.push(`${highRiskBens} high-risk beneficiary records flagged for identity anomalies`);
      }
      if (failedBens > 0) {
        benScore += Math.min(10, failedBens * 5);
        benFactors.push(`${failedBens} beneficiaries failed document cross-dataset verification`);
      }
      benScore = Math.min(30, benScore);

      // 2. Attendance Sub-Score (Max 25)
      const attFactors: string[] = [];
      let attScore = 5;
      const attAlerts = await AnomalyAlert.find({
        projectId,
        type: { $in: ['ATTENDANCE_MISMATCH', 'UNUSUAL_ATTENDANCE'] },
        status: { $in: ['OPEN', 'INVESTIGATING'] },
      });
      if (attAlerts.length > 0) {
        attScore += Math.min(20, attAlerts.length * 10);
        attFactors.push(`${attAlerts.length} active attendance anomalies (low face-to-tick ratio or headcount variance)`);
      }
      attScore = Math.min(25, attScore);

      // 3. Financial Sub-Score (Max 20)
      const finFactors: string[] = [];
      let finScore = 4;
      const finRecord = await FinancialRecord.findOne({ projectId });
      if (finRecord) {
        const burnDeficit = (finRecord.financialBurnPercent || 0) - (finRecord.verifiedPhysicalProgressPercent || 0);
        if (burnDeficit > 20) {
          finScore += 12;
          finFactors.push(`Financial burn (${finRecord.financialBurnPercent}%) exceeds physical progress (${finRecord.verifiedPhysicalProgressPercent}%) by ${burnDeficit}%`);
        }
        if (finRecord.anomaliesDetected && finRecord.anomaliesDetected.length > 0) {
          finScore += Math.min(8, finRecord.anomaliesDetected.length * 4);
          finFactors.push(`${finRecord.anomaliesDetected.length} financial audit flags detected`);
        }
      }
      finScore = Math.min(20, finScore);

      // 4. Inspection Sub-Score (Max 15)
      const inspFactors: string[] = [];
      let inspScore = 3;
      const openActions = await CorrectiveAction.countDocuments({ projectId, status: { $in: ['OPEN', 'OVERDUE'] } });
      if (openActions > 0) {
        inspScore += Math.min(12, openActions * 6);
        inspFactors.push(`${openActions} unresolved inspection corrective action directives`);
      }
      inspScore = Math.min(15, inspScore);

      // 5. Compliance Sub-Score (Max 10)
      const compFactors: string[] = [];
      let compScore = 2;
      const orgName = (project.organizationId as any)?.name;
      if (orgName) {
        const historicalMatch = await ComplianceRecord.findOne({
          ngoName: { $regex: orgName.split(' ')[0], $options: 'i' },
        });
        if (historicalMatch) {
          compScore = 8;
          compFactors.push(`Historical Ministry record on file: ${historicalMatch.actionType} (${historicalMatch.orderNumber || 'Historical'})`);
        }
      }
      compScore = Math.min(10, compScore);

      const overall = benScore + attScore + finScore + inspScore + compScore;
      let band = RiskLevel.LOW;
      if (overall >= 80) band = RiskLevel.CRITICAL;
      else if (overall >= 60) band = RiskLevel.HIGH;
      else if (overall >= 30) band = RiskLevel.MEDIUM;

      const breakdown: IRiskScoreBreakdown = {
        overallScore: overall,
        riskBand: band,
        calculatedAt: new Date(),
        isDecisionSupportOnly: true,
        categoryBreakdown: {
          beneficiaryIntegrity: { score: benScore, max: 30, contributingFactors: benFactors },
          attendance: { score: attScore, max: 25, contributingFactors: attFactors },
          financial: { score: finScore, max: 20, contributingFactors: finFactors },
          inspection: { score: inspScore, max: 15, contributingFactors: inspFactors },
          compliance: { score: compScore, max: 10, contributingFactors: compFactors },
        },
        summaryText: `Overall Risk Score is ${overall}/100 (${band}). Automated decision support advisory only — official human adjudication required before administrative sanction.`,
      };

      // Update project score in db
      project.riskScore = overall;
      project.riskLevel = band;
      await project.save();

      const response: ApiResponse<IRiskScoreBreakdown> = {
        success: true,
        data: breakdown,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}

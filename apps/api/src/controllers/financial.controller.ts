import { Request, Response } from 'express';
import { FinancialRecord } from '../models/financialRecord.model';
import { Project } from '../models/project.model';
import { ApiResponse } from '@nirikshan/shared-types';
import { AuthorizationService } from '../services/authorization.service';

export class FinancialController {
  public static async getFinancialRecords(req: Request, res: Response): Promise<void> {
    try {
      const scopeFilter = req.user ? AuthorizationService.buildScopeFilter(req.user, 'financial') : {};
      const records = await FinancialRecord.find(scopeFilter)
        .populate('projectId', 'name code scheme location riskLevel')
        .populate('organizationId', 'name code state district')
        .sort({ updatedAt: -1 });

      const totalSanctioned = records.reduce((acc, r) => acc + (r.totalSanctionedGrant || 0), 0);
      const totalDisbursed = records.reduce((acc, r) => acc + (r.totalDisbursedFunds || 0), 0);
      const totalExpenditure = records.reduce((acc, r) => acc + (r.totalExpenditure || 0), 0);

      const highRiskCount = records.filter((r) => (r.riskScore || 0) >= 60).length;
      const totalInvoices = records.reduce((acc, r) => acc + (r.invoices?.length || 0), 0);
      const flaggedInvoicesCount = records.reduce(
        (acc, r) => acc + (r.invoices?.filter((inv) => inv.isFlagged)?.length || 0),
        0,
      );

      const stats = {
        totalSanctioned,
        totalDisbursed,
        totalExpenditure,
        overallBurnRatePercent: totalDisbursed > 0 ? Math.round((totalExpenditure / totalDisbursed) * 100) : 0,
        highRiskCount,
        totalInvoices,
        flaggedInvoicesCount,
      };

      const response: ApiResponse<any> = {
        success: true,
        data: {
          records,
          stats,
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  public static async getFinancialRecordByProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const record = await FinancialRecord.findOne({ projectId })
        .populate('projectId')
        .populate('organizationId');

      if (!record) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Financial record not found for project' } });
        return;
      }

      if (req.user && !AuthorizationService.canAccessObject(req.user, record, 'financial')) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Financial record is outside your authorized scope' } });
        return;
      }

      res.status(200).json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  public static async runFinancialAudit(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.body;
      const record = await FinancialRecord.findOne({ projectId });
      if (!record) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Financial record not found' } });
        return;
      }

      // Execute Rules 16-22 Logic
      const findings: any[] = [];
      let calculatedRisk = 15;

      // Rule 21: Physical progress vs financial burn rate mismatch
      const burn = record.financialBurnPercent || 0;
      const phys = record.verifiedPhysicalProgressPercent || 0;
      if (burn - phys > 25) {
        findings.push({
          ruleId: 'RULE_21_SPENDING_VS_PROJECT_PROGRESS',
          ruleName: 'Spending Disproportionate to Verified Progress',
          severity: 'HIGH',
          reason: `Financial utilization is ${burn}% while verified physical inspection progress is only ${phys}%. Deficit of ${burn - phys}%.`,
          evidence: { financialBurn: burn, physicalProgress: phys, threshold: 25 },
        });
        calculatedRisk += 35;
      }

      // Rule 19: Spending near fiscal deadlines
      const q4Invoices = record.invoices.filter((inv) => inv.date?.includes('-03-'));
      const q4Sum = q4Invoices.reduce((s, inv) => s + inv.amount, 0);
      if (record.totalExpenditure > 0 && q4Sum / record.totalExpenditure > 0.4) {
        findings.push({
          ruleId: 'RULE_19_SPENDING_NEAR_DEADLINES',
          ruleName: 'Fiscal Year-End Spending Rush (March Spike)',
          severity: 'MEDIUM',
          reason: `${Math.round((q4Sum / record.totalExpenditure) * 100)}% of total annual expenditure was transacted in the final days of March.`,
          evidence: { marchExpenditure: q4Sum, totalExpenditure: record.totalExpenditure },
        });
        calculatedRisk += 20;
      }

      // Rule 20: Split invoices over ceiling
      const splitInvoices = record.invoices.filter((inv) => inv.isFlagged);
      if (splitInvoices.length > 0) {
        findings.push({
          ruleId: 'RULE_20_EXPENSE_OVER_AUTHORISED_LIMIT',
          ruleName: 'Split Invoices Circumventing Procurement Ceiling',
          severity: 'HIGH',
          reason: `${splitInvoices.length} consecutive invoices flagged for potential procurement ceiling splitting.`,
          evidence: { flaggedInvoices: splitInvoices.map((inv) => inv.invoiceNumber) },
        });
        calculatedRisk += 25;
      }

      record.riskScore = Math.min(100, calculatedRisk);
      record.anomaliesDetected = findings.map((f) => `${f.ruleId}: ${f.reason}`);
      record.lastAuditedAt = new Date();
      await record.save();

      res.status(200).json({
        success: true,
        data: {
          projectId,
          riskScore: record.riskScore,
          findings,
          auditedAt: record.lastAuditedAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}

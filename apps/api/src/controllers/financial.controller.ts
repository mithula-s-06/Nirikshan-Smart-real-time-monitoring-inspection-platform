import { Request, Response } from 'express';
import crypto from 'crypto';
import { FinancialRecord } from '../models/financialRecord.model';
import { Project } from '../models/project.model';
import { Organization } from '../models/organization.model';
import { AnomalyAlert } from '../models/anomalyAlert.model';
import {
  ApiResponse,
  AnomalyType,
  AnomalySeverity,
  AlertStatus,
  RiskLevel,
} from '@nirikshan/shared-types';
import { AuthorizationService } from '../services/authorization.service';

export class FinancialController {
  /**
   * Retrieves all financial records with summary statistics.
   * Auto-seeds records for remaining projects if only a few are seeded.
   */
  public static async getFinancialRecords(req: Request, res: Response): Promise<void> {
    try {
      const scopeFilter = req.user ? AuthorizationService.buildScopeFilter(req.user, 'financial') : {};
      let records = await FinancialRecord.find(scopeFilter)
        .populate('projectId', 'name code scheme location riskLevel district state')
        .populate('organizationId', 'name code state district')
        .sort({ updatedAt: -1 });

      // If database has projects without financial records, auto-seed them
      if (records.length <= 2) {
        await FinancialController.autoSeedRemainingProjects();
        records = await FinancialRecord.find(scopeFilter)
          .populate('projectId', 'name code scheme location riskLevel district state')
          .populate('organizationId', 'name code state district')
          .sort({ updatedAt: -1 });
      }

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

  /**
   * Retrieves a single financial record by Project ID
   */
  public static async getFinancialRecordByProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      let record = await FinancialRecord.findOne({ projectId })
        .populate('projectId')
        .populate('organizationId');

      // If no record exists for this project, auto-generate one
      if (!record) {
        const project = await Project.findById(projectId);
        if (!project) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
          return;
        }

        const newRecord = await FinancialController.createDefaultRecordForProject(project);
        record = await FinancialRecord.findById(newRecord.id)
          .populate('projectId')
          .populate('organizationId');
      }

      if (req.user && record && !AuthorizationService.canAccessObject(req.user, record, 'financial')) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Financial record is outside your authorized scope' } });
        return;
      }

      res.status(200).json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  /**
   * Creates or updates a project's financial grant record
   */
  public static async createFinancialRecord(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        organizationId,
        financialYear = '2025-2026',
        totalSanctionedGrant = 0,
        totalDisbursedFunds = 0,
        verifiedPhysicalProgressPercent = 50,
        budgetHeads = [],
        invoices = [],
      } = req.body;

      if (!projectId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'projectId is required' } });
        return;
      }

      const totalExpenditure = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);
      const financialBurnPercent = totalDisbursedFunds > 0
        ? Math.round((totalExpenditure / totalDisbursedFunds) * 100 * 10) / 10
        : 0;
      const closingBalance = Math.max(0, totalDisbursedFunds - totalExpenditure);

      let record = await FinancialRecord.findOne({ projectId });
      if (record) {
        record.totalSanctionedGrant = totalSanctionedGrant;
        record.totalDisbursedFunds = totalDisbursedFunds;
        record.totalExpenditure = totalExpenditure;
        record.closingBalance = closingBalance;
        record.verifiedPhysicalProgressPercent = verifiedPhysicalProgressPercent;
        record.financialBurnPercent = financialBurnPercent;
        if (budgetHeads.length > 0) record.budgetHeads = budgetHeads;
        if (invoices.length > 0) record.invoices = invoices;
        await record.save();
      } else {
        record = await FinancialRecord.create({
          projectId,
          organizationId,
          financialYear,
          totalSanctionedGrant,
          totalDisbursedFunds,
          totalExpenditure,
          openingBalance: 0,
          closingBalance,
          verifiedPhysicalProgressPercent,
          financialBurnPercent,
          budgetHeads,
          invoices,
          riskScore: 15,
        });
      }

      const populated = await FinancialRecord.findById(record.id)
        .populate('projectId', 'name code scheme location riskLevel')
        .populate('organizationId', 'name code state district');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  /**
   * Adds an invoice to a financial record with automated ceiling breach & split detection
   */
  public static async addInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const invoiceData = req.body;

      const record = await FinancialRecord.findById(id);
      if (!record) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Financial record not found' } });
        return;
      }

      const invoiceAmount = Number(invoiceData.amount) || 0;
      const invoiceDate = invoiceData.date || new Date().toISOString().substring(0, 10);
      const vendorName = (invoiceData.vendorName || '').trim();

      // Check Rule 20: Split procurement ceiling breach (multiple invoices close to ₹5,00,000 threshold)
      let isFlagged = invoiceData.isFlagged || false;
      let flagReason = invoiceData.flagReason || '';

      const sameVendorInvoices = record.invoices.filter((inv) =>
        inv.vendorName?.toLowerCase() === vendorName.toLowerCase()
      );

      if (sameVendorInvoices.length > 0) {
        const lastInv = sameVendorInvoices[sameVendorInvoices.length - 1];
        if (lastInv.amount + invoiceAmount > 500000 && invoiceAmount >= 200000) {
          isFlagged = true;
          flagReason = `Consecutive invoice to ${vendorName} circumvents ₹5,00,000 procurement tendering ceiling.`;
        }
      }

      // Generate SHA-256 document hash
      const docHash = invoiceData.documentHash || crypto
        .createHash('sha256')
        .update(`${record.id}:${invoiceData.invoiceNumber}:${invoiceAmount}:${invoiceDate}:${Date.now()}`)
        .digest('hex');

      const newInvoice = {
        id: `INV-${Date.now().toString().slice(-6)}`,
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        vendorName: vendorName || 'Authorized Vendor',
        vendorGstin: invoiceData.vendorGstin || '27AAACP0000A1Z5',
        amount: invoiceAmount,
        date: invoiceDate,
        description: invoiceData.description || 'Facility operations and service supply invoice',
        category: invoiceData.category || 'CONSUMABLES',
        documentHash: docHash,
        isFlagged,
        flagReason: isFlagged ? flagReason : undefined,
      };

      record.invoices.push(newInvoice);
      record.totalExpenditure = record.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      if (record.totalDisbursedFunds > 0) {
        record.financialBurnPercent = Math.round((record.totalExpenditure / record.totalDisbursedFunds) * 100 * 10) / 10;
      }
      record.closingBalance = Math.max(0, record.totalDisbursedFunds - record.totalExpenditure);

      // Update matching budget head utilization if applicable
      const matchingHead = record.budgetHeads.find(
        (bh) => bh.name.toLowerCase().includes(invoiceData.category?.toLowerCase() || '')
      );
      if (matchingHead) {
        matchingHead.utilizedAmount += invoiceAmount;
      } else if (record.budgetHeads.length > 0) {
        record.budgetHeads[0].utilizedAmount += invoiceAmount;
      }

      await record.save();

      const populated = await FinancialRecord.findById(record.id)
        .populate('projectId', 'name code scheme location riskLevel')
        .populate('organizationId', 'name code state district');

      res.status(200).json({
        success: true,
        message: 'Invoice logged and hashed successfully',
        data: {
          invoice: newInvoice,
          record: populated,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  /**
   * Adds an invoice by Project ID directly
   */
  public static async addInvoiceByProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      let record = await FinancialRecord.findOne({ projectId });
      if (!record) {
        const project = await Project.findById(projectId);
        if (!project) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
          return;
        }
        record = await FinancialController.createDefaultRecordForProject(project);
      }

      req.params.id = record.id;
      return FinancialController.addInvoice(req, res);
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  /**
   * Runs the automated Financial Intelligence Audit Engine (Rules 16 to 22)
   */
  public static async runFinancialAudit(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.body;
      let record = await FinancialRecord.findOne({ projectId });
      if (!record) {
        const project = await Project.findById(projectId);
        if (!project) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project facility not found' } });
          return;
        }
        record = await FinancialController.createDefaultRecordForProject(project);
      }

      const findings: any[] = [];
      let calculatedRisk = 12;

      // Rule 16: Sanctioned Ceiling Breached
      if (record.totalExpenditure > record.totalSanctionedGrant && record.totalSanctionedGrant > 0) {
        findings.push({
          ruleId: 'RULE_16_SANCTIONED_CEILING_BREACH',
          ruleName: 'Grant Expenditure Exceeds Approved Ministry Sanction',
          severity: 'CRITICAL',
          reason: `Total claimed expenditure of ₹${record.totalExpenditure.toLocaleString('en-IN')} exceeds sanctioned allocation of ₹${record.totalSanctionedGrant.toLocaleString('en-IN')}.`,
          evidence: {
            expenditure: record.totalExpenditure,
            sanctioned: record.totalSanctionedGrant,
            excess: record.totalExpenditure - record.totalSanctionedGrant,
          },
        });
        calculatedRisk += 40;
      }

      // Rule 18: Milestone Velocity Deficit
      const burn = record.financialBurnPercent || 0;
      const phys = record.verifiedPhysicalProgressPercent || 0;
      if (burn > 75 && phys < 50) {
        findings.push({
          ruleId: 'RULE_18_MILESTONE_VELOCITY_DEFICIT',
          ruleName: 'High Grant Burn with Sub-50% Physical Infrastructure Completion',
          severity: 'HIGH',
          reason: `Institution has consumed ${burn}% of central funds, but on-site milestone progress stands at only ${phys}%. Release of next tranche must be blocked pending GFR 12-A verification.`,
          evidence: { financialBurn: burn, physicalProgress: phys },
        });
        calculatedRisk += 30;
      }

      // Rule 21: Progress vs financial burn rate mismatch
      if (burn - phys > 20) {
        findings.push({
          ruleId: 'RULE_21_SPENDING_VS_PROJECT_PROGRESS',
          ruleName: 'Spending Disproportionate to Verified Progress',
          severity: 'HIGH',
          reason: `Financial utilization is ${burn}% while verified physical inspection progress is only ${phys}%. Deficit of ${Math.round(burn - phys)}% exceeds allowed threshold.`,
          evidence: { financialBurn: burn, physicalProgress: phys, deficit: Math.round(burn - phys) },
        });
        calculatedRisk += 35;
      }

      // Rule 19: Spending near fiscal deadlines (March Spike)
      const q4Invoices = record.invoices.filter((inv) => inv.date?.includes('-03-'));
      const q4Sum = q4Invoices.reduce((s, inv) => s + (inv.amount || 0), 0);
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
          reason: `${splitInvoices.length} consecutive invoice(s) flagged for circumventing procurement ceiling.`,
          evidence: { flaggedInvoices: splitInvoices.map((inv) => inv.invoiceNumber) },
        });
        calculatedRisk += 25;
      }

      record.riskScore = Math.min(100, calculatedRisk);
      record.anomaliesDetected = findings.map((f) => `${f.ruleId}: ${f.reason}`);
      record.lastAuditedAt = new Date();
      await record.save();

      // Update linked project risk
      const project = await Project.findById(projectId);
      if (project) {
        project.riskScore = record.riskScore;
        project.riskLevel =
          record.riskScore >= 70 ? RiskLevel.CRITICAL :
          record.riskScore >= 50 ? RiskLevel.HIGH :
          record.riskScore >= 30 ? RiskLevel.MEDIUM : RiskLevel.LOW;
        await project.save();
      }

      // Create AnomalyAlert in database if severe findings exist
      if (findings.length > 0) {
        const primaryFinding = findings[0];
        const existingAlert = await AnomalyAlert.findOne({
          projectId,
          title: { $regex: primaryFinding.ruleId, $options: 'i' },
          status: AlertStatus.OPEN,
        });

        if (!existingAlert) {
          await AnomalyAlert.create({
            projectId,
            type: AnomalyType.REPORTING_SPIKE,
            severity: primaryFinding.severity === 'CRITICAL' ? AnomalySeverity.CRITICAL : AnomalySeverity.HIGH,
            status: AlertStatus.OPEN,
            confidence: 0.94,
            title: `[${primaryFinding.ruleId}] ${primaryFinding.ruleName}`,
            reason: primaryFinding.reason,
            source: 'RULE_ENGINE',
            metrics: {
              riskScore: record.riskScore,
              financialBurn: burn,
              physicalProgress: phys,
              deficit: burn - phys,
            },
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          projectId,
          projectName: project?.name,
          riskScore: record.riskScore,
          financialBurnPercent: burn,
          verifiedPhysicalProgressPercent: phys,
          deficit: Math.round(burn - phys),
          findings,
          auditedAt: record.lastAuditedAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  /**
   * Seeds financial records for all active projects
   */
  public static async seedAllProjects(_req: Request, res: Response): Promise<void> {
    try {
      const seeded = await FinancialController.autoSeedRemainingProjects();
      res.status(200).json({
        success: true,
        message: `Successfully verified and seeded financial records for all projects.`,
        data: { seededCount: seeded },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  /**
   * Helper: Auto-seeds financial records for any project lacking one
   */
  private static async autoSeedRemainingProjects(): Promise<number> {
    const projects = await Project.find({});
    let count = 0;

    for (const project of projects) {
      const existing = await FinancialRecord.findOne({ projectId: project._id });
      if (!existing) {
        await FinancialController.createDefaultRecordForProject(project);
        count++;
      }
    }

    return count;
  }

  /**
   * Helper: Creates a realistic financial grant record for a given project
   */
  private static async createDefaultRecordForProject(project: any) {
    const org = project.organizationId
      ? await Organization.findById(project.organizationId)
      : await Organization.findOne({});

    // Baseline grant amounts tailored to scheme
    const isSolarOrInfra = project.name.toLowerCase().includes('solar') || project.name.toLowerCase().includes('water') || project.name.toLowerCase().includes('center');
    const totalSanctionedGrant = isSolarOrInfra ? 3000000 : 2000000;
    const totalDisbursedFunds = Math.round(totalSanctionedGrant * 0.8);

    // Calculate realistic burn vs physical progress based on project's risk level
    let verifiedPhysicalProgressPercent = 65;
    let financialBurnPercent = 68;
    let riskScore = project.riskScore || 20;

    if (project.riskLevel === RiskLevel.HIGH || project.riskLevel === RiskLevel.CRITICAL) {
      verifiedPhysicalProgressPercent = 38;
      financialBurnPercent = 84;
      riskScore = 78;
    } else if (project.riskLevel === RiskLevel.MEDIUM) {
      verifiedPhysicalProgressPercent = 52;
      financialBurnPercent = 64;
      riskScore = 42;
    }

    const totalExpenditure = Math.round((totalDisbursedFunds * financialBurnPercent) / 100);
    const closingBalance = Math.max(0, totalDisbursedFunds - totalExpenditure);

    const budgetHeads = [
      {
        name: 'Infrastructure & Capital Assets',
        sanctionedAmount: Math.round(totalSanctionedGrant * 0.45),
        utilizedAmount: Math.round(totalExpenditure * 0.45),
        headLimit: Math.round(totalSanctionedGrant * 0.45),
      },
      {
        name: 'Beneficiary Allowances & Kits',
        sanctionedAmount: Math.round(totalSanctionedGrant * 0.35),
        utilizedAmount: Math.round(totalExpenditure * 0.35),
        headLimit: Math.round(totalSanctionedGrant * 0.35),
      },
      {
        name: 'Administrative & Audit Overheads',
        sanctionedAmount: Math.round(totalSanctionedGrant * 0.2),
        utilizedAmount: Math.round(totalExpenditure * 0.2),
        headLimit: Math.round(totalSanctionedGrant * 0.2),
      },
    ];

    const isHighRisk = riskScore >= 60;
    const invoices = [
      {
        id: `INV-2026-${project.code || 'PRJ'}-01`,
        invoiceNumber: `${project.code || 'GEN'}-VEND-101`,
        vendorName: isHighRisk ? 'Apex Educational Supplies Pvt Ltd' : 'Sahyadri Provisions & Tools Ltd',
        vendorGstin: '27AABCA1234F1Z5',
        amount: Math.round(totalExpenditure * 0.6),
        date: isHighRisk ? '2026-03-24' : '2026-02-10',
        description: 'Facility operational materials and hardware assets supply',
        category: 'CAPITAL_ASSETS',
        documentHash: crypto.createHash('sha256').update(`${project._id}:inv1:${Date.now()}`).digest('hex'),
        isFlagged: isHighRisk,
        flagReason: isHighRisk ? 'Advance invoice claimed without on-site installation inspection verification.' : undefined,
      },
      {
        id: `INV-2026-${project.code || 'PRJ'}-02`,
        invoiceNumber: `${project.code || 'GEN'}-VEND-102`,
        vendorName: isHighRisk ? 'Apex Educational Supplies Pvt Ltd' : 'National Utilities Corporation',
        vendorGstin: '27AABCA1234F1Z5',
        amount: Math.round(totalExpenditure * 0.4),
        date: isHighRisk ? '2026-03-25' : '2026-02-28',
        description: 'Consumables, lab test sets, and digital training peripherals',
        category: 'CONSUMABLES',
        documentHash: crypto.createHash('sha256').update(`${project._id}:inv2:${Date.now()}`).digest('hex'),
        isFlagged: isHighRisk,
        flagReason: isHighRisk ? 'Consecutive invoice issued on following day splitting procurement ceiling.' : undefined,
      },
    ];

    const anomaliesDetected = isHighRisk ? [
      `RULE_21_SPENDING_VS_PROJECT_PROGRESS: ${financialBurnPercent}% funds burned against ${verifiedPhysicalProgressPercent}% verified milestone completion.`,
      `RULE_19_SPENDING_NEAR_DEADLINES: High expenditure clustered in final days before fiscal closing.`,
    ] : [];

    return await FinancialRecord.create({
      projectId: project._id,
      organizationId: org?._id,
      financialYear: '2025-2026',
      totalSanctionedGrant,
      totalDisbursedFunds,
      totalExpenditure,
      openingBalance: 0,
      closingBalance,
      verifiedPhysicalProgressPercent,
      financialBurnPercent,
      riskScore,
      budgetHeads,
      invoices,
      anomaliesDetected,
      lastAuditedAt: new Date(),
    });
  }
}

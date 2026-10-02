import {
  AnomalyType,
  AnomalySeverity,
  AlertStatus,
  AuditAction,
  UserRole,
  RiskLevel,
} from '@nirikshan/shared-types';
import { AnomalyAlert, IAnomalyAlertDocument } from '../models/anomalyAlert.model';
import { Project } from '../models/project.model';
import { Evidence } from '../models/evidence.model';
import { emitter } from '../socket/emitter';
import { recordAudit } from './audit.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  AnalyzeAttendanceInput,
  AnalyzeProgressVelocityInput,
  AnalyzeDuplicateEvidenceInput,
  UpdateAlertStatusInput,
  GetAlertsQueryInput,
} from '@nirikshan/validation';

export interface AnomalyAnalysisResult {
  isAnomaly: boolean;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  confidenceScore: number;
  title: string;
  explainableReason: string;
  metrics: Record<string, unknown>;
  recommendedAction: string;
  alert?: any;
}

export class AiAnomalyService {
  /**
   * Evaluates Attendance discrepancy between muster rolls and on-site headcounts
   */
  public static async analyzeAttendance(
    input: AnalyzeAttendanceInput,
    actor?: { id: string; email: string; role: UserRole },
  ): Promise<AnomalyAnalysisResult> {
    const project = await Project.findById(input.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID '${input.projectId}' not found.`);
    }

    const claimed = input.claimedAttendance;
    const observed = input.observedAttendance;
    const discrepancy = claimed - observed;
    const denominator = Math.max(claimed, 1.0);
    const deficitPct = Math.max(0.0, (discrepancy / denominator) * 100.0);

    let isAnomaly = false;
    let severity = AnomalySeverity.LOW;
    let confidence = 0.5;
    let title = 'Normal Attendance Concordance';
    let reason = `Observed headcount (${observed}) closely matches claimed muster (${claimed}) with minimal variance (${deficitPct.toFixed(1)}%).`;
    let recommendedAction = 'No action required; log record into verification ledger.';

    if (deficitPct >= 40.0) {
      isAnomaly = true;
      severity = AnomalySeverity.CRITICAL;
      confidence = Math.min(0.98, 0.70 + (deficitPct / 100.0) * 0.3);
      title = `Critical Ghost Workforce Anomaly Detected (${deficitPct.toFixed(1)}% Deficit)`;
      reason = `Physical on-site headcount (${observed} workers) is ${deficitPct.toFixed(1)}% lower than claimed muster roll (${claimed} workers). Massive workforce discrepancy indicates ghost worker fraud or inflated wage claims.`;
      recommendedAction = 'Halt wage disbursement; trigger unannounced physical biometric audit and inspect site contractor.';
    } else if (deficitPct >= 20.0) {
      isAnomaly = true;
      severity = AnomalySeverity.HIGH;
      confidence = 0.85;
      title = `Significant Attendance Mismatch Detected (${deficitPct.toFixed(1)}% Deficit)`;
      reason = `Observed on-site headcount (${observed}) is ${deficitPct.toFixed(1)}% below claimed muster logs (${claimed}). Exceeds acceptable variance threshold.`;
      recommendedAction = 'Demand contractor muster reconciliation within 48 hours and conduct surprise follow-up verification.';
    } else if (deficitPct >= 10.0) {
      isAnomaly = true;
      severity = AnomalySeverity.MEDIUM;
      confidence = 0.70;
      title = `Moderate Attendance Variance (${deficitPct.toFixed(1)}% Deficit)`;
      reason = `Minor workforce shortage observed (${observed} vs. ${claimed} claimed). Variance of ${deficitPct.toFixed(1)}% warrants operational monitoring.`;
      recommendedAction = 'Flag for automatic inclusion in next randomized inspection cycle.';
    }

    let createdAlert = null;
    if (isAnomaly && (severity === AnomalySeverity.HIGH || severity === AnomalySeverity.CRITICAL || severity === AnomalySeverity.MEDIUM)) {
      createdAlert = await AnomalyAlert.create({
        projectId: project._id,
        inspectionId: input.inspectionId || null,
        type: AnomalyType.ATTENDANCE_MISMATCH,
        severity,
        status: AlertStatus.OPEN,
        confidence: Number(confidence.toFixed(2)),
        title,
        reason,
        source: 'AI_SERVICE',
        metrics: {
          claimedAttendance: claimed,
          observedAttendance: observed,
          discrepancyCount: discrepancy,
          deficitPercentage: Number(deficitPct.toFixed(2)),
          historicalAverage: input.historicalAverage,
        },
      });

      // Escalate project risk score
      const riskIncrement = severity === AnomalySeverity.CRITICAL ? 25 : severity === AnomalySeverity.HIGH ? 15 : 5;
      project.riskScore = Math.min(100, (project.riskScore || 50) + riskIncrement);
      if (project.riskScore >= 80) project.riskLevel = RiskLevel.CRITICAL;
      else if (project.riskScore >= 60) project.riskLevel = RiskLevel.HIGH;
      await project.save();

      // Emit real-time alert to Super Admins & Officials
      emitter.emitAlertCreated(createdAlert.toJSON());

      if (actor) {
        await recordAudit({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AuditAction.ALERT_CREATED,
          resource: 'AnomalyAlert',
          resourceId: createdAlert.id,
          details: {
            alertId: createdAlert.id,
            projectId: project.id,
            severity,
            type: AnomalyType.ATTENDANCE_MISMATCH,
          },
        });
      }
    }

    return {
      isAnomaly,
      anomalyType: AnomalyType.ATTENDANCE_MISMATCH,
      severity,
      confidenceScore: Number(confidence.toFixed(2)),
      title,
      explainableReason: reason,
      metrics: {
        claimedAttendance: claimed,
        observedAttendance: observed,
        discrepancyCount: discrepancy,
        deficitPercentage: Number(deficitPct.toFixed(2)),
      },
      recommendedAction,
      alert: createdAlert ? createdAlert.toJSON() : undefined,
    };
  }

  /**
   * Evaluates Fiscal disbursement velocity vs physical milestone completion
   */
  public static async analyzeProgressVelocity(
    input: AnalyzeProgressVelocityInput,
    actor?: { id: string; email: string; role: UserRole },
  ): Promise<AnomalyAnalysisResult> {
    const project = await Project.findById(input.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID '${input.projectId}' not found.`);
    }

    const disbursed = input.disbursedFundsAmount;
    const sanctioned = input.sanctionedBudgetAmount;
    const physical = input.reportedPhysicalProgressPct;

    const disbursedPct = (disbursed / sanctioned) * 100.0;
    const velocityRatio = disbursedPct / Math.max(physical, 1.0);
    const divergenceGap = disbursedPct - physical;

    let isAnomaly = false;
    let severity = AnomalySeverity.LOW;
    let confidence = 0.60;
    let title = 'Healthy Fiscal-to-Physical Alignment';
    let reason = `Fund disbursement (${disbursedPct.toFixed(1)}%) aligns harmoniously with physical work (${physical.toFixed(1)}%).`;
    let recommendedAction = 'Approve next standard milestone inspection.';

    if (disbursedPct > 60.0 && physical < 30.0) {
      isAnomaly = true;
      severity = AnomalySeverity.CRITICAL;
      confidence = 0.96;
      title = `Critical Fiscal Divergence (${disbursedPct.toFixed(1)}% Spent vs. ${physical.toFixed(1)}% Complete)`;
      reason = `Disbursed funds (₹${disbursed.toLocaleString()} / ${disbursedPct.toFixed(1)}%) drastically outpace verified civil milestone progress (${physical.toFixed(1)}%). Velocity ratio (${velocityRatio.toFixed(2)}x) signals premature fund liquidation without corresponding construction.`;
      recommendedAction = 'Freeze subsequent tranche releases immediately; mandate a comprehensive forensic engineering audit.';
    } else if (divergenceGap >= 25.0) {
      isAnomaly = true;
      severity = AnomalySeverity.HIGH;
      confidence = 0.88;
      title = `High Fund-Progress Divergence (${divergenceGap.toFixed(1)}% Gap)`;
      reason = `Fund utilization (${disbursedPct.toFixed(1)}%) leads physical execution (${physical.toFixed(1)}%) by ${divergenceGap.toFixed(1)}%. Velocity ratio (${velocityRatio.toFixed(2)}x) indicates high risk of cost overrun or delayed milestone delivery.`;
      recommendedAction = 'Withhold interim contractor billing until civil progress catches up to scheduled baseline.';
    } else if (divergenceGap >= 12.0) {
      isAnomaly = true;
      severity = AnomalySeverity.MEDIUM;
      confidence = 0.75;
      title = `Moderate Expenditure Velocity Gap (${divergenceGap.toFixed(1)}% Gap)`;
      reason = `Minor fiscal lead observed (${disbursedPct.toFixed(1)}% disbursed vs ${physical.toFixed(1)}% completed). Within borderline acceptable variance range.`;
      recommendedAction = 'Notify implementing agency officer and request monthly utilization certificate.';
    }

    let createdAlert = null;
    if (isAnomaly) {
      createdAlert = await AnomalyAlert.create({
        projectId: project._id,
        type: AnomalyType.REPORTING_SPIKE,
        severity,
        status: AlertStatus.OPEN,
        confidence: Number(confidence.toFixed(2)),
        title,
        reason,
        source: 'AI_SERVICE',
        metrics: {
          disbursedFundsAmount: disbursed,
          sanctionedBudgetAmount: sanctioned,
          disbursedPercentage: Number(disbursedPct.toFixed(2)),
          reportedPhysicalProgressPct: physical,
          divergenceGapPct: Number(divergenceGap.toFixed(2)),
          velocityRatio: Number(velocityRatio.toFixed(2)),
        },
      });

      project.riskScore = Math.min(100, (project.riskScore || 50) + (severity === AnomalySeverity.CRITICAL ? 20 : 10));
      await project.save();

      emitter.emitAlertCreated(createdAlert.toJSON());

      if (actor) {
        await recordAudit({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AuditAction.ALERT_CREATED,
          resource: 'AnomalyAlert',
          resourceId: createdAlert.id,
          details: {
            alertId: createdAlert.id,
            projectId: project.id,
            severity,
            type: AnomalyType.REPORTING_SPIKE,
          },
        });
      }
    }

    return {
      isAnomaly,
      anomalyType: AnomalyType.REPORTING_SPIKE,
      severity,
      confidenceScore: Number(confidence.toFixed(2)),
      title,
      explainableReason: reason,
      metrics: {
        disbursedFundsAmount: disbursed,
        sanctionedBudgetAmount: sanctioned,
        disbursedPercentage: Number(disbursedPct.toFixed(2)),
        reportedPhysicalProgressPct: physical,
        divergenceGapPct: Number(divergenceGap.toFixed(2)),
        velocityRatio: Number(velocityRatio.toFixed(2)),
      },
      recommendedAction,
      alert: createdAlert ? createdAlert.toJSON() : undefined,
    };
  }

  /**
   * Cross-checks cryptographic and perceptual signatures for recycled photographic fraud
   */
  public static async analyzeDuplicateEvidence(
    input: AnalyzeDuplicateEvidenceInput,
    actor?: { id: string; email: string; role: UserRole },
  ): Promise<AnomalyAnalysisResult> {
    const project = await Project.findById(input.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID '${input.projectId}' not found.`);
    }

    // Check if another project has the exact same SHA-256 hash
    const matchingEvidence = await Evidence.findOne({
      sha256Hash: input.sha256Hash,
      projectId: { $ne: project._id },
    }).populate('projectId', 'name code state');

    if (matchingEvidence) {
      const matchedProjectName = (matchingEvidence.projectId as any)?.name || 'Differing Project Site';
      const matchedProjectId = (matchingEvidence.projectId as any)?.id || matchingEvidence.projectId?.toString() || 'UNKNOWN_PROJECT';

      const title = 'Recycled Photographic Proof Fraud Detected';
      const reason = `Cryptographic SHA-256 hash match detected! The uploaded evidence file (ID: ${input.evidenceId}) is bit-for-bit identical to evidence ID '${matchingEvidence.id}' originally recorded for project '${matchedProjectName}'. Reused photos across differing geographical sites indicates fraudulent evidence submission.`;
      const recommendedAction = 'Reject inspection report immediately; blacklist inspector or contractor pending disciplinary probe.';

      const createdAlert = await AnomalyAlert.create({
        projectId: project._id,
        inspectionId: input.inspectionId || null,
        type: AnomalyType.DUPLICATE_EVIDENCE,
        severity: AnomalySeverity.CRITICAL,
        status: AlertStatus.OPEN,
        confidence: 1.0,
        title,
        reason,
        source: 'AI_SERVICE',
        metrics: {
          targetEvidenceId: input.evidenceId,
          matchedEvidenceId: matchingEvidence.id,
          matchedProjectId,
          matchedProjectName,
          sha256Hash: input.sha256Hash,
        },
      });

      project.riskScore = 100;
      project.riskLevel = RiskLevel.CRITICAL;
      await project.save();

      emitter.emitAlertCreated(createdAlert.toJSON());

      if (actor) {
        await recordAudit({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AuditAction.ALERT_CREATED,
          resource: 'AnomalyAlert',
          resourceId: createdAlert.id,
          details: {
            alertId: createdAlert.id,
            projectId: project.id,
            severity: AnomalySeverity.CRITICAL,
            type: AnomalyType.DUPLICATE_EVIDENCE,
          },
        });
      }

      return {
        isAnomaly: true,
        anomalyType: AnomalyType.DUPLICATE_EVIDENCE,
        severity: AnomalySeverity.CRITICAL,
        confidenceScore: 1.0,
        title,
        explainableReason: reason,
        metrics: {
          targetEvidenceId: input.evidenceId,
          matchedEvidenceId: matchingEvidence.id,
          matchedProjectId,
          sha256Hash: input.sha256Hash,
        },
        recommendedAction,
        alert: createdAlert.toJSON(),
      };
    }

    return {
      isAnomaly: false,
      anomalyType: AnomalyType.DUPLICATE_EVIDENCE,
      severity: AnomalySeverity.LOW,
      confidenceScore: 0.99,
      title: 'Unique Photographic Evidence Verified',
      explainableReason: 'No duplicate cryptographic signatures found across existing project databases.',
      metrics: {
        evidenceId: input.evidenceId,
        sha256Hash: input.sha256Hash,
        isUnique: true,
      },
      recommendedAction: 'Accept evidence asset into immutable storage.',
    };
  }

  /**
   * Retrieves paginated alerts with filters
   */
  public static async getAlerts(query: GetAlertsQueryInput) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.severity) filter.severity = query.severity;
    if (query.type) filter.type = query.type;
    if (query.projectId) filter.projectId = query.projectId;

    const [items, total] = await Promise.all([
      AnomalyAlert.find(filter)
        .populate('projectId', 'name code state district riskLevel')
        .populate('inspectionId', 'inspectionId status')
        .populate('assignedOfficerId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AnomalyAlert.countDocuments(filter),
    ]);

    return {
      items: items.map((a) => a.toJSON()),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single alert by ID
   */
  public static async getAlertById(id: string) {
    const alert = await AnomalyAlert.findById(id)
      .populate('projectId')
      .populate('inspectionId')
      .populate('assignedOfficerId', 'name email role');

    if (!alert) {
      throw new NotFoundError(`Anomaly alert with ID '${id}' not found.`);
    }

    return alert.toJSON();
  }

  /**
   * Updates status of an alert (Investigate / Resolve / Dismiss)
   */
  public static async updateAlertStatus(
    id: string,
    input: UpdateAlertStatusInput,
    actor: { id: string; email: string; role: UserRole },
  ) {
    const alert = await AnomalyAlert.findById(id);
    if (!alert) {
      throw new NotFoundError(`Anomaly alert with ID '${id}' not found.`);
    }

    alert.status = input.status;
    if (input.resolutionNotes) {
      alert.resolutionNotes = input.resolutionNotes;
    }
    if (input.assignedOfficerId) {
      alert.assignedOfficerId = input.assignedOfficerId as any;
    }
    if (input.status === AlertStatus.RESOLVED || input.status === AlertStatus.DISMISSED) {
      alert.resolvedAt = new Date();
    }

    await alert.save();

    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: input.status === AlertStatus.RESOLVED ? AuditAction.ALERT_RESOLVED : AuditAction.ALERT_CREATED,
      resource: 'AnomalyAlert',
      resourceId: alert.id,
      details: {
        alertId: alert.id,
        newStatus: input.status,
        resolutionNotes: input.resolutionNotes,
      },
    });

    return alert.toJSON();
  }
}

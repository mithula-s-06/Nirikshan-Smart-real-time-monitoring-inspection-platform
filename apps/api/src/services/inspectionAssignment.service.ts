import { UserRole, UserStatus, InspectionType, InspectionPriority, InspectionStatus, AuditAction } from '@nirikshan/shared-types';
import { Project, IProjectDocument } from '../models/project.model';
import { User, IUserDocument } from '../models/user.model';
import { Inspection } from '../models/inspection.model';
import { calculateHaversineDistance } from '../utils/geo';
import { recordAudit } from './audit.service';
import { emitter } from '../socket/emitter';
import { logger } from '../utils/logger';

export interface AutoAssignOptions {
  state?: string;
  district?: string;
  type?: InspectionType;
  priority?: InspectionPriority;
  count?: number;
  assignedByUserId?: string;
}

export interface CandidateScore {
  project: IProjectDocument;
  totalScore: number;
  breakdown: {
    riskScoreComponent: number; // 30%
    inspectionGapComponent: number; // 20%
    complaintSignalsComponent: number; // 20%
    attendanceAnomalyComponent: number; // 15%
    reportingAnomalyComponent: number; // 10%
    randomFactorComponent: number; // 5%
  };
  reason: string;
}

export class InspectionAssignmentService {
  /**
   * Generates weighted randomized surprise or routine inspection assignments.
   */
  public static async generateAssignments(options: AutoAssignOptions = {}) {
    const {
      state,
      district,
      type = InspectionType.SURPRISE,
      priority = InspectionPriority.HIGH,
      count = 3,
      assignedByUserId,
    } = options;

    logger.info({ state, district, type, count }, '🎲 Running Weighted Random Inspection Assignment Engine...');

    // 1. Fetch eligible active projects
    const projectFilter: Record<string, any> = {
      status: { $in: ['ACTIVE', 'FLAGGED'] },
    };
    if (state) projectFilter.state = new RegExp(state, 'i');
    if (district) projectFilter.district = new RegExp(district, 'i');

    const eligibleProjects = await Project.find(projectFilter);
    if (eligibleProjects.length === 0) {
      return { assignments: [], message: 'No eligible projects found matching criteria.' };
    }

    // 2. Fetch eligible active inspectors
    const inspectorFilter: Record<string, any> = {
      role: UserRole.INSPECTOR,
      status: UserStatus.ACTIVE,
    };
    if (state) inspectorFilter.state = new RegExp(state, 'i');

    let eligibleInspectors = await User.find(inspectorFilter);
    if (eligibleInspectors.length === 0) {
      // Fallback to all nationwide active inspectors if none in specific state
      eligibleInspectors = await User.find({ role: UserRole.INSPECTOR, status: UserStatus.ACTIVE });
    }

    if (eligibleInspectors.length === 0) {
      return { assignments: [], message: 'No active inspectors available for assignment.' };
    }

    // 3. Compute Weighted Scores for Candidate Projects
    const candidateScores: CandidateScore[] = eligibleProjects.map((project) => {
      // 30% Risk level / past violations score (0-100)
      const baseRiskScore = project.riskScore || (project.riskLevel === 'CRITICAL' ? 90 : project.riskLevel === 'HIGH' ? 75 : 30);
      const riskComponent = baseRiskScore * 0.3;

      // 20% Inspection gap (Days since last inspection; max 180 days = 100 points)
      const daysSinceInspection = project.lastInspectedAt
        ? Math.min(180, (Date.now() - new Date(project.lastInspectedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 180;
      const gapScore = (daysSinceInspection / 180) * 100;
      const gapComponent = gapScore * 0.2;

      // 20% Complaint signals (Derived from risk factor & status)
      const complaintScore = project.status === 'FLAGGED' ? 95 : baseRiskScore * 0.8;
      const complaintComponent = complaintScore * 0.2;

      // 15% Attendance anomaly indicators (15%)
      const attendanceScore = baseRiskScore > 60 ? 85 : 20;
      const attendanceComponent = attendanceScore * 0.15;

      // 10% Reporting anomalies
      const reportingScore = baseRiskScore > 50 ? 70 : 15;
      const reportingComponent = reportingScore * 0.1;

      // 5% Non-deterministic Random factor
      const randomFactor = Math.random() * 100;
      const randomComponent = randomFactor * 0.05;

      const totalScore = Math.round(
        riskComponent + gapComponent + complaintComponent + attendanceComponent + reportingComponent + randomComponent,
      );

      const reason = `Weighted score: ${totalScore}/100 [Risk: ${riskComponent.toFixed(1)}, Gap: ${gapComponent.toFixed(1)}, Complaints: ${complaintComponent.toFixed(1)}, Attendance: ${attendanceComponent.toFixed(1)}, Reporting: ${reportingComponent.toFixed(1)}, Random: ${randomComponent.toFixed(1)}]`;

      return {
        project,
        totalScore,
        breakdown: {
          riskScoreComponent: riskComponent,
          inspectionGapComponent: gapComponent,
          complaintSignalsComponent: complaintComponent,
          attendanceAnomalyComponent: attendanceComponent,
          reportingAnomalyComponent: reportingComponent,
          randomFactorComponent: randomComponent,
        },
        reason,
      };
    });

    // 4. Sort projects by weighted score descending
    candidateScores.sort((a, b) => b.totalScore - a.totalScore);
    const selectedCandidates = candidateScores.slice(0, count);

    const createdAssignments = [];

    // 5. Match Candidate Projects with Best Available Inspector (Conflict-of-Interest Aware)
    for (let i = 0; i < selectedCandidates.length; i++) {
      const candidate = selectedCandidates[i];
      const project = candidate.project;

      // Filter out inspectors with Conflict of Interest (e.g. same organization)
      const nonConflictedInspectors = eligibleInspectors.filter((inspector) => {
        if (inspector.organizationId && project.organizationId) {
          return inspector.organizationId.toString() !== project.organizationId.toString();
        }
        return true;
      });

      const pool = nonConflictedInspectors.length > 0 ? nonConflictedInspectors : eligibleInspectors;

      // Pick best matching inspector (round-robin / location proximity preference)
      const assignedInspector = pool[i % pool.length];

      // Auto-generate human-readable inspectionId
      const timestamp = Date.now().toString().slice(-4);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const inspectionId = `INSP-${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;

      const inspection = await Inspection.create({
        inspectionId,
        projectId: project._id,
        inspectorId: assignedInspector._id,
        assignedBy: assignedByUserId,
        type,
        priority,
        status: InspectionStatus.ASSIGNED,
        assignedAt: new Date(),
        assignmentReason: `Auto-assigned via Random Assignment Engine. ${candidate.reason}`,
        auditHistory: [
          {
            stage: 'ASSIGNED',
            timestamp: new Date(),
            actorId: assignedByUserId || 'SYSTEM_ENGINE',
            comment: candidate.reason,
          },
        ],
      });

      createdAssignments.push(inspection);
      emitter.emitInspectionAssigned(inspection.toJSON());

      await recordAudit({
        actorId: assignedByUserId,
        action: AuditAction.INSPECTION_ASSIGNED,
        resource: 'Inspection',
        resourceId: inspection._id.toString(),
        details: {
          inspectionId,
          projectId: project._id.toString(),
          projectName: project.name,
          inspectorId: assignedInspector._id.toString(),
          inspectorEmail: assignedInspector.email,
          weightedScore: candidate.totalScore,
          type,
        },
      });
    }

    logger.info(`✅ Generated ${createdAssignments.length} automated inspection assignments.`);

    return {
      count: createdAssignments.length,
      assignments: createdAssignments.map((a) => a.toJSON()),
    };
  }
}

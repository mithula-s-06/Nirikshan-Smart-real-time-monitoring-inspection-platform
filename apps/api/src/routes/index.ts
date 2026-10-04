import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { organizationRoutes } from './organization.routes';
import { projectRoutes } from './project.routes';
import { inspectionRoutes } from './inspection.routes';
import { checklistRoutes } from './checklist.routes';
import evidenceRoutes from './evidence.routes';
import syncRoutes from './sync.routes';
import anomalyRoutes from './anomaly.routes';
import cctvRoutes from './cctv.routes';
import attendanceRoutes from './attendance.routes';
import complianceRoutes from './compliance.routes';
import financialRoutes from './financial.routes';
import correctiveActionRoutes from './correctiveAction.routes';
import beneficiaryRoutes from './beneficiary.routes';
import vcRoutes from './vc.routes';
import riskRoutes from './risk.routes';
import userRoutes from './user.routes';

const router = Router();

// /api/v1/health
router.use('/health', healthRoutes);

// /api/v1/auth
router.use('/auth', authRoutes);

// /api/v1/organizations
router.use('/organizations', organizationRoutes);

// /api/v1/projects
router.use('/projects', projectRoutes);

// /api/v1/inspections
router.use('/inspections', inspectionRoutes);

// /api/v1/evidence
router.use('/evidence', evidenceRoutes);

// /api/v1/checklists
router.use('/checklists', checklistRoutes);

// /api/v1/sync
router.use('/sync', syncRoutes);

// /api/v1/anomalies
router.use('/anomalies', anomalyRoutes);

// /api/v1/cctv
router.use('/cctv', cctvRoutes);

// /api/v1/compliance
router.use('/compliance', complianceRoutes);

// /api/v1/financial
router.use('/financial', financialRoutes);

// /api/v1/corrective-actions
router.use('/corrective-actions', correctiveActionRoutes);

// /api/v1/beneficiaries
router.use('/beneficiaries', beneficiaryRoutes);

// /api/v1/vc
router.use('/vc', vcRoutes);

// /api/v1/risk
router.use('/risk', riskRoutes);

// /api/v1/attendance & unified beneficiary integrity (Rules 2-8, sessions, units, staff)
router.use('/attendance', attendanceRoutes);
router.use('/', attendanceRoutes);

// /api/v1/users
router.use('/users', userRoutes);

export const apiRouter = router;




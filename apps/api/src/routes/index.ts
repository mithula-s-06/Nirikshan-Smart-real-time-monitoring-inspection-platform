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

export const apiRouter = router;



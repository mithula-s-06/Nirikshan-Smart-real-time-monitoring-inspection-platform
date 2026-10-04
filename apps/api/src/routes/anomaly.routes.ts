import { Router } from 'express';
import { AnomalyController } from '../controllers/anomaly.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@nirikshan/shared-types';

const router = Router();

// Protect all anomaly endpoints with JWT auth
router.use(authenticate);

// Real-time AI Analysis Endpoints
router.post(
  '/analyze/attendance',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  AnomalyController.analyzeAttendance,
);

router.post(
  '/analyze/progress-velocity',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  AnomalyController.analyzeProgressVelocity,
);

router.post(
  '/analyze/duplicate-evidence',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  AnomalyController.analyzeDuplicateEvidence,
);

// Alert Management & Investigation Endpoints
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  AnomalyController.getAlerts,
);

router.get(
  '/alerts',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  AnomalyController.getAlerts,
);

router.get(
  '/alerts/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  AnomalyController.getAlertById,
);

router.patch(
  '/alerts/:id/status',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER),
  AnomalyController.updateAlertStatus,
);

export default router;

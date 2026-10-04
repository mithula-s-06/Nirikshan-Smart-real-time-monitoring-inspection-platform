import { Router } from 'express';
import { CCTVController } from '../controllers/cctv.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@nirikshan/shared-types';

const router = Router();

// Stream feed endpoint and mobile proxy can be accessed directly
router.get('/cameras/:id/live-feed', CCTVController.getLiveFeed);
router.get('/mobile-stream', CCTVController.getMobileStream);
router.get('/config', CCTVController.getConfig);
router.post('/config', CCTVController.updateConfig);

// Protect all remaining CCTV configuration & playback token endpoints
router.use(authenticate);

// Directory & Inspection Access
router.get(
  '/cameras',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  CCTVController.getCameras,
);

router.get(
  '/cameras/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  CCTVController.getCameraById,
);

// Secure tokenized stream access
router.post(
  '/cameras/:id/stream-token',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  CCTVController.getSecureStreamAccess,
);

// Edge telemetry heartbeat
router.post(
  '/cameras/:id/heartbeat',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER, UserRole.INSPECTOR),
  CCTVController.recordHeartbeat,
);

// Commissioning & Maintenance
router.post(
  '/cameras',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL),
  CCTVController.registerCamera,
);

router.patch(
  '/cameras/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL),
  CCTVController.updateCamera,
);

router.delete(
  '/cameras/:id',
  authorize(UserRole.SUPER_ADMIN),
  CCTVController.deleteCamera,
);

export default router;

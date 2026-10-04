import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all compliance endpoints with JWT auth
router.use(authenticate);

router.get('/', ComplianceController.getComplianceRecords);
router.get('/:id', ComplianceController.getComplianceRecordById);

export default router;

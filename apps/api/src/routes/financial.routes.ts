import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all financial endpoints with JWT auth
router.use(authenticate);

router.get('/', FinancialController.getFinancialRecords);
router.get('/project/:projectId', FinancialController.getFinancialRecordByProject);
router.post('/audit', FinancialController.runFinancialAudit);

export default router;

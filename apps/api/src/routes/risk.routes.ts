import { Router } from 'express';
import { RiskController } from '../controllers/risk.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all risk endpoints with JWT auth
router.use(authenticate);

router.get('/project/:projectId', RiskController.calculateProjectRisk);

export default router;

import { Router } from 'express';
import { CorrectiveActionController } from '../controllers/correctiveAction.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all corrective action endpoints with JWT auth
router.use(authenticate);

router.get('/', CorrectiveActionController.getActions);
router.post('/', CorrectiveActionController.createAction);
router.patch('/:id/status', CorrectiveActionController.updateActionStatus);

export default router;

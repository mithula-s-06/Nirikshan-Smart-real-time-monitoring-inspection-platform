import { Router } from 'express';
import { VCController } from '../controllers/vc.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all VC endpoints with JWT auth
router.use(authenticate);

router.get('/', VCController.getSessions);
router.post('/surprise', VCController.initiateSurpriseVC);

export default router;

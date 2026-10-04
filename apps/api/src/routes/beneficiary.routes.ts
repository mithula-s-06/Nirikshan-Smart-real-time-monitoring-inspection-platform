import { Router } from 'express';
import { BeneficiaryController } from '../controllers/beneficiary.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all beneficiary endpoints with JWT auth
router.use(authenticate);

router.get('/', BeneficiaryController.getBeneficiaries);
router.get('/:id', BeneficiaryController.getBeneficiaryById);
router.get('/code/:code', BeneficiaryController.getBeneficiaryByCode);

export default router;

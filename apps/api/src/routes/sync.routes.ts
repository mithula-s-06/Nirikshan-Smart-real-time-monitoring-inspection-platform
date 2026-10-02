import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();

router.use(authenticate);
router.use(idempotencyMiddleware());

router.get('/pull', SyncController.pull);
router.post('/push', SyncController.push);

export default router;

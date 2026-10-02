import { Router } from 'express';
import { EvidenceController } from '../controllers/evidence.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

// Routes attached under /api/v1/inspections/:id/evidence
export const inspectionEvidenceRouter = Router({ mergeParams: true });
inspectionEvidenceRouter.use(authenticate);

inspectionEvidenceRouter.post('/', uploadSingle, EvidenceController.uploadEvidence);
inspectionEvidenceRouter.get('/', EvidenceController.getInspectionEvidence);

// Direct evidence entity routes under /api/v1/evidence
router.use(authenticate);

router.get('/:id', EvidenceController.getEvidenceById);
router.get('/:id/stream', EvidenceController.streamFile);
router.post('/:id/verify-hash', EvidenceController.verifyIntegrity);
router.delete('/:id', EvidenceController.deleteEvidence);

export default router;

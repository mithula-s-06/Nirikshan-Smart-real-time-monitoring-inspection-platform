import { Router } from 'express';
import { ChecklistController } from '../controllers/checklist.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createChecklistTemplateSchema } from '@nirikshan/validation';
import { UserRole } from '@nirikshan/shared-types';

const router = Router();

router.use(authenticate);

router.get('/', ChecklistController.list);
router.get('/:id', ChecklistController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.PMU_OFFICER),
  validateBody(createChecklistTemplateSchema),
  ChecklistController.create,
);

export const checklistRoutes = router;

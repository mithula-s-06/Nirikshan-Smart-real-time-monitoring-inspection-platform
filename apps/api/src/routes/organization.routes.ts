import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createOrganizationSchema, updateOrganizationSchema } from '@nirikshan/validation';
import { UserRole } from '@nirikshan/shared-types';

const router = Router();

// All organization endpoints require authentication
router.use(authenticate);

router.get('/', OrganizationController.list);
router.get('/:id', OrganizationController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.STATE_AUTHORITY),
  validateBody(createOrganizationSchema),
  OrganizationController.create,
);

router.patch(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_OFFICIAL, UserRole.STATE_AUTHORITY),
  validateBody(updateOrganizationSchema),
  OrganizationController.update,
);

export const organizationRoutes = router;

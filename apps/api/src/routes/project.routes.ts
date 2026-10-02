import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema, nearbyProjectsQuerySchema } from '@nirikshan/validation';
import { UserRole } from '@nirikshan/shared-types';

const router = Router();

// All project endpoints require authentication
router.use(authenticate);

// Special endpoints
router.get('/stats/overview', ProjectController.getStats);
router.get('/nearby', validateQuery(nearbyProjectsQuerySchema), ProjectController.getNearby);

// Core CRUD
router.get('/', ProjectController.list);
router.get('/:id', ProjectController.getById);

router.post(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.DEPARTMENT_OFFICIAL,
    UserRole.PMU_OFFICER,
    UserRole.DISTRICT_AUTHORITY,
    UserRole.STATE_AUTHORITY,
  ),
  validateBody(createProjectSchema),
  ProjectController.create,
);

router.patch(
  '/:id',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.DEPARTMENT_OFFICIAL,
    UserRole.PMU_OFFICER,
    UserRole.DISTRICT_AUTHORITY,
    UserRole.STATE_AUTHORITY,
  ),
  validateBody(updateProjectSchema),
  ProjectController.update,
);

export const projectRoutes = router;

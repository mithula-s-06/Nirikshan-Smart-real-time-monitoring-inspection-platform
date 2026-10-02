import { Router } from 'express';
import { InspectionController } from '../controllers/inspection.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  createInspectionSchema,
  autoAssignInspectionSchema,
  inspectionLocationActionSchema,
  submitInspectionSchema,
  reviewInspectionSchema,
} from '@nirikshan/validation';
import { UserRole } from '@nirikshan/shared-types';
import { inspectionEvidenceRouter } from './evidence.routes';

const router = Router();

// All inspection endpoints require authentication
router.use(authenticate);

// Evidence sub-routes
router.use('/:id/evidence', inspectionEvidenceRouter);

// List & Detail
router.get('/', InspectionController.list);
router.get('/:id', InspectionController.getById);

// Manual & Auto Assignment
router.post(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.DEPARTMENT_OFFICIAL,
    UserRole.PMU_OFFICER,
    UserRole.DISTRICT_AUTHORITY,
    UserRole.STATE_AUTHORITY,
  ),
  validateBody(createInspectionSchema),
  InspectionController.create,
);

router.post(
  '/auto-assign',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.DEPARTMENT_OFFICIAL,
    UserRole.PMU_OFFICER,
    UserRole.DISTRICT_AUTHORITY,
    UserRole.STATE_AUTHORITY,
  ),
  validateBody(autoAssignInspectionSchema),
  InspectionController.autoAssign,
);

// Lifecycle Transitions (Inspector Actions)
router.post('/:id/accept', InspectionController.accept);
router.post('/:id/en-route', InspectionController.enRoute);
router.post('/:id/arrive', validateBody(inspectionLocationActionSchema), InspectionController.arrive);
router.post('/:id/start', validateBody(inspectionLocationActionSchema), InspectionController.start);
router.post('/:id/submit', validateBody(submitInspectionSchema), InspectionController.submit);

// Review & Approval (Department Official / Authority Action)
router.post(
  '/:id/review',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.DEPARTMENT_OFFICIAL,
    UserRole.PMU_OFFICER,
    UserRole.STATE_AUTHORITY,
    UserRole.DISTRICT_AUTHORITY,
  ),
  validateBody(reviewInspectionSchema),
  InspectionController.review,
);

export const inspectionRoutes = router;

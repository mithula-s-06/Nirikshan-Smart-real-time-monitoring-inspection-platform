import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { loginSchema, refreshTokenSchema, createUserSchema } from '@nirikshan/validation';
import { UserRole } from '@nirikshan/shared-types';

const router = Router();

// Public Authentication Endpoints
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh', validateBody(refreshTokenSchema), AuthController.refresh);
router.post('/logout', AuthController.logout);

// Protected Authentication Endpoints
router.get('/me', authenticate, AuthController.getMe);
router.get('/sessions', authenticate, AuthController.getSessions);
router.delete('/sessions/:sessionId', authenticate, AuthController.revokeSession);

// Admin-only User Creation
router.post(
  '/users',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.SYSTEM_SUPER_ADMIN, UserRole.DOSJE_HQ_ADMIN, UserRole.DEPARTMENT_OFFICIAL),
  validateBody(createUserSchema),
  AuthController.createUser,
);

export const authRoutes = router;

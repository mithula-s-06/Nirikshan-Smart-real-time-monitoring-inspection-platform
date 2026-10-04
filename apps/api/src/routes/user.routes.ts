import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { Permissions } from '@nirikshan/shared-types';

const router = Router();

router.use(authenticate);

// User administration routes protected by granular permissions
router.get('/', requirePermission(Permissions.USER_READ), UserController.listUsers);
router.get('/:id', requirePermission(Permissions.USER_READ), UserController.getUserById);
router.patch('/:id/role', requirePermission(Permissions.USER_UPDATE), UserController.assignRole);
router.patch('/:id/suspend', requirePermission(Permissions.USER_DISABLE), UserController.suspendUser);
router.patch('/:id/reactivate', requirePermission(Permissions.USER_UPDATE), UserController.reactivateUser);
router.post('/:id/temporary-access', requirePermission(Permissions.SECURITY_MANAGE), UserController.grantTemporaryAccess);

export default router;

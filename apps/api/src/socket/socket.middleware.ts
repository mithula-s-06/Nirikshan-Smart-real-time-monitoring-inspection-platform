import { Socket } from 'socket.io';
import { verifyAccessToken } from '../services/token.service';
import { User } from '../models/user.model';
import { UserStatus, IUser } from '@nirikshan/shared-types';
import { logger } from '../utils/logger';

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.split(' ')[1]
        : undefined);

    if (!token) {
      logger.warn({ socketId: socket.id }, '🔌 Socket connection rejected: Missing token');
      return next(new Error('Authentication error: Missing token'));
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.id);
    if (!user) {
      logger.warn({ socketId: socket.id, userId: payload.id }, '🔌 Socket connection rejected: User not found');
      return next(new Error('Authentication error: User does not exist'));
    }

    if (user.status !== UserStatus.ACTIVE) {
      logger.warn({ socketId: socket.id, userId: payload.id, status: user.status }, '🔌 Socket connection rejected: Account not active');
      return next(new Error(`Authentication error: Account is ${user.status}`));
    }

    socket.data.user = user.toJSON() as IUser;
    next();
  } catch (error: any) {
    logger.warn({ socketId: socket.id, err: error.message }, '🔌 Socket authentication failed');
    next(new Error(`Authentication error: ${error.message || 'Invalid token'}`));
  }
}

import http from 'http';
import { Server, Socket } from 'socket.io';
import { SocketEvent, UserRole, IUser } from '@nirikshan/shared-types';
import { socketAuthMiddleware } from './socket.middleware';
import { emitter } from './emitter';
import { AuthenticatedSocket, IGpsLocationStreamPayload } from './socket.types';
import { logger } from '../utils/logger';

let ioInstance: Server | null = null;

export function initializeSocketServer(httpServer: http.Server): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Attach Authentication Middleware
  io.use(socketAuthMiddleware);

  // Set emitter instance
  emitter.setServer(io);
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user: IUser = authSocket.data.user;
    const userId = user.id || (user as any)._id?.toString();

    logger.info(
      { socketId: socket.id, userId, role: user.role, email: user.email },
      '🔌 Client connected to Socket.IO real-time telemetry stream',
    );

    // 1. Join Personal and Role Rooms
    if (userId) {
      socket.join(`user:${userId}`);
    }
    if (user.role) {
      socket.join(`role:${user.role}`);
    }
    if (user.state) {
      socket.join(`state:${user.state}`);
    }

    // 2. Handle Inspection Room Subscriptions
    socket.on(SocketEvent.JOIN_INSPECTION, (payload: { inspectionId: string }, callback?: (res: any) => void) => {
      if (!payload?.inspectionId) {
        if (callback) callback({ success: false, error: 'Missing inspectionId' });
        return;
      }
      const room = `inspection:${payload.inspectionId}`;
      socket.join(room);
      logger.info({ socketId: socket.id, userId, room }, '📡 Client joined inspection channel');
      if (callback) callback({ success: true, room });
    });

    socket.on(SocketEvent.LEAVE_INSPECTION, (payload: { inspectionId: string }, callback?: (res: any) => void) => {
      if (!payload?.inspectionId) {
        if (callback) callback({ success: false, error: 'Missing inspectionId' });
        return;
      }
      const room = `inspection:${payload.inspectionId}`;
      socket.leave(room);
      logger.info({ socketId: socket.id, userId, room }, '📡 Client left inspection channel');
      if (callback) callback({ success: true, room });
    });

    // 3. Handle Inspector Real-Time GPS Telemetry Broadcasting
    socket.on(SocketEvent.LOCATION_UPDATE, (payload: IGpsLocationStreamPayload, callback?: (res: any) => void) => {
      try {
        if (!payload || !payload.inspectionId || !payload.coordinates) {
          if (callback) callback({ success: false, error: 'Invalid GPS telemetry payload' });
          return;
        }

        const enrichedPayload = {
          ...payload,
          inspectorId: userId,
          inspectorName: user.name,
          inspectorEmail: user.email,
          receivedAt: new Date().toISOString(),
        };

        // Broadcast to specific inspection room (e.g. for supervisors monitoring this mission)
        io.to(`inspection:${payload.inspectionId}`).emit(SocketEvent.LOCATION_UPDATE, enrichedPayload);

        // Broadcast to high-level admin & command center rooms
        io.to(`role:${UserRole.SUPER_ADMIN}`).emit(SocketEvent.LOCATION_UPDATE, enrichedPayload);
        io.to(`role:${UserRole.DEPARTMENT_OFFICIAL}`).emit(SocketEvent.LOCATION_UPDATE, enrichedPayload);

        if (callback) callback({ success: true, timestamp: enrichedPayload.receivedAt });
      } catch (err: any) {
        logger.error({ err, socketId: socket.id }, 'Error processing GPS telemetry stream');
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 4. Handle Disconnect
    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, userId, reason }, '🔌 Socket client disconnected');
    });
  });

  return io;
}

export function getSocketServer(): Server | null {
  return ioInstance;
}

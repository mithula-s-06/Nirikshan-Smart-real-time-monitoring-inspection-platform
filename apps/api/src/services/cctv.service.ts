import crypto from 'crypto';
import {
  CameraStatus,
  StreamProtocol,
  SocketEvent,
  AuditAction,
  UserRole,
} from '@nirikshan/shared-types';
import { CCTVCamera, ICCTVCameraDocument } from '../models/cctvCamera.model';
import { Project } from '../models/project.model';
import { emitter } from '../socket/emitter';
import { recordAudit } from './audit.service';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  CreateCCTVCameraInput,
  UpdateCCTVCameraInput,
  CameraHeartbeatInput,
  GetCCTVQueryInput,
} from '@nirikshan/validation';

export class CCTVService {
  /**
   * Registers a new CCTV camera asset associated with a project site
   */
  public static async registerCamera(
    input: CreateCCTVCameraInput,
    actor?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
  ) {
    const project = await Project.findById(input.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID '${input.projectId}' was not found.`);
    }

    const existingCamera = await CCTVCamera.findOne({ code: input.code.toUpperCase() });
    if (existingCamera) {
      throw new ConflictError(`Camera with code '${input.code.toUpperCase()}' already exists.`);
    }

    let locationPoint = undefined;
    if (input.longitude !== undefined && input.latitude !== undefined) {
      locationPoint = {
        type: 'Point',
        coordinates: [input.longitude, input.latitude],
      };
    } else if (project.location && project.location.coordinates) {
      locationPoint = {
        type: 'Point',
        coordinates: project.location.coordinates,
      };
    }

    const camera = await CCTVCamera.create({
      name: input.name,
      code: input.code.toUpperCase(),
      projectId: project._id,
      locationDescription: input.locationDescription,
      location: locationPoint,
      protocol: input.protocol || StreamProtocol.HLS,
      rawStreamUrl: input.rawStreamUrl || null,
      isDemo: input.isDemo || false,
      resolution: input.resolution || '1080p',
      fps: input.fps || 30,
      status: CameraStatus.ONLINE, // Initial state upon physical commissioning
      lastHeartbeatAt: new Date(),
    });

    // Set secure proxy streamPath
    camera.streamPath = `/api/v1/cctv/cameras/${camera.id}/live-feed`;
    await camera.save();

    if (actor) {
      await recordAudit({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AuditAction.CONFIG_MODIFIED,
        resource: 'CCTVCamera',
        resourceId: camera.id,
        details: {
          cameraId: camera.id,
          code: camera.code,
          projectId: project.id,
          protocol: camera.protocol,
        },
        ipAddress,
        userAgent,
      });
    }

    return camera.toJSON();
  }

  /**
   * Retrieves paginated CCTV camera directory with status filters
   */
  public static async getCameras(query: GetCCTVQueryInput) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.projectId) filter.projectId = query.projectId;
    if (query.status) filter.status = query.status;
    if (query.protocol) filter.protocol = query.protocol;

    const [items, total] = await Promise.all([
      CCTVCamera.find(filter)
        .populate('projectId', 'name code state district location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CCTVCamera.countDocuments(filter),
    ]);

    return {
      items: items.map((c) => c.toJSON()),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves camera details by ID
   */
  public static async getCameraById(id: string) {
    const camera = await CCTVCamera.findById(id).populate('projectId');
    if (!camera) {
      throw new NotFoundError(`CCTV Camera with ID '${id}' was not found.`);
    }
    return camera.toJSON();
  }

  /**
   * Ingests edge camera heartbeat telemetry & detects camera degradation/offline state
   */
  public static async recordHeartbeat(id: string, input: CameraHeartbeatInput) {
    const camera = await CCTVCamera.findById(id);
    if (!camera) {
      throw new NotFoundError(`CCTV Camera with ID '${id}' was not found.`);
    }

    const oldStatus = camera.status;
    const newStatus = input.status || CameraStatus.ONLINE;

    camera.status = newStatus;
    camera.lastHeartbeatAt = new Date();
    if (input.fps !== undefined) camera.fps = input.fps;
    if (input.resolution !== undefined) camera.resolution = input.resolution;
    if (input.cpuUsagePct !== undefined) camera.cpuUsagePct = input.cpuUsagePct;
    if (input.memoryUsagePct !== undefined) camera.memoryUsagePct = input.memoryUsagePct;

    await camera.save();

    // If camera health status transitioned, broadcast real-time event to command center
    if (oldStatus !== newStatus) {
      logger.info(
        { cameraId: camera.id, code: camera.code, oldStatus, newStatus },
        '📹 CCTV Camera status change detected',
      );

      const payload = {
        cameraId: camera.id,
        cameraCode: camera.code,
        projectId: camera.projectId.toString(),
        oldStatus,
        newStatus,
        lastHeartbeatAt: camera.lastHeartbeatAt,
      };

      emitter.emitToRole(UserRole.SUPER_ADMIN, SocketEvent.CCTV_STATUS_CHANGED, payload);
      emitter.emitToRole(UserRole.DEPARTMENT_OFFICIAL, SocketEvent.CCTV_STATUS_CHANGED, payload);
    }

    return {
      success: true,
      cameraId: camera.id,
      status: camera.status,
      lastHeartbeatAt: camera.lastHeartbeatAt,
    };
  }

  /**
   * Generates safe, tokenized, expiring playback URL for frontend video players
   */
  public static async getSecureStreamAccess(
    id: string,
    ttlSeconds: number = 3600,
    actor?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
  ) {
    const camera = await CCTVCamera.findById(id).populate('projectId', 'name code state');
    if (!camera) {
      throw new NotFoundError(`CCTV Camera with ID '${id}' was not found.`);
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const tokenPayload = `${camera.id}:${expiresAt.getTime()}:${camera.code}`;
    const token = crypto
      .createHmac('sha256', process.env.JWT_ACCESS_SECRET || 'nirikshan_secure_secret_key_2026')
      .update(tokenPayload)
      .digest('hex');

    const playbackUrl = `/api/v1/cctv/cameras/${camera.id}/live-feed?token=${token}&expires=${expiresAt.getTime()}`;

    if (actor) {
      await recordAudit({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AuditAction.CCTV_ACCESSED,
        resource: 'CCTVCamera',
        resourceId: camera.id,
        details: {
          cameraId: camera.id,
          cameraCode: camera.code,
          projectId: (camera.projectId as any)?.id || camera.projectId.toString(),
          protocol: camera.protocol,
          ttlSeconds,
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      cameraId: camera.id,
      cameraCode: camera.code,
      cameraName: camera.name,
      status: camera.status,
      protocol: camera.protocol,
      resolution: camera.resolution,
      fps: camera.fps,
      isDemo: camera.isDemo,
      playbackUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Updates camera configuration
   */
  public static async updateCamera(
    id: string,
    input: UpdateCCTVCameraInput,
    actor?: { id: string; email: string; role: UserRole },
  ) {
    const camera = await CCTVCamera.findById(id);
    if (!camera) {
      throw new NotFoundError(`CCTV Camera with ID '${id}' was not found.`);
    }

    if (input.name) camera.name = input.name;
    if (input.locationDescription) camera.locationDescription = input.locationDescription;
    if (input.status) camera.status = input.status;
    if (input.protocol) camera.protocol = input.protocol;
    if (input.rawStreamUrl !== undefined) camera.rawStreamUrl = input.rawStreamUrl;
    if (input.isDemo !== undefined) camera.isDemo = input.isDemo;
    if (input.resolution) camera.resolution = input.resolution;
    if (input.fps !== undefined) camera.fps = input.fps;

    await camera.save();

    if (actor) {
      await recordAudit({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AuditAction.CONFIG_MODIFIED,
        resource: 'CCTVCamera',
        resourceId: camera.id,
        details: { cameraId: camera.id, updates: input },
      });
    }

    return camera.toJSON();
  }

  /**
   * Deletes a camera asset
   */
  public static async deleteCamera(
    id: string,
    actor?: { id: string; email: string; role: UserRole },
  ) {
    const camera = await CCTVCamera.findById(id);
    if (!camera) {
      throw new NotFoundError(`CCTV Camera with ID '${id}' was not found.`);
    }

    await CCTVCamera.findByIdAndDelete(id);

    if (actor) {
      await recordAudit({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AuditAction.CONFIG_MODIFIED,
        resource: 'CCTVCamera',
        resourceId: id,
        details: { action: 'DELETED', cameraId: id, cameraCode: camera.code },
      });
    }
  }
}

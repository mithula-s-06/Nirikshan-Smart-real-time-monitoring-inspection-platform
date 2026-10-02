import { Request, Response, NextFunction } from 'express';
import { CCTVService } from '../services/cctv.service';
import {
  createCCTVCameraSchema,
  updateCCTVCameraSchema,
  cameraHeartbeatSchema,
  generateStreamTokenSchema,
  getCCTVQuerySchema,
} from '@nirikshan/validation';

export class CCTVController {
  public static async registerCamera(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = createCCTVCameraSchema.parse(req.body);
      const camera = await CCTVService.registerCamera(
        validatedInput,
        (req as any).user,
        req.ip,
        req.headers['user-agent'],
      );
      res.status(201).json({
        success: true,
        data: camera,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCameras(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = getCCTVQuerySchema.parse(req.query);
      const result = await CCTVService.getCameras(validatedQuery as any);
      res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCameraById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const camera = await CCTVService.getCameraById(req.params.id);
      res.status(200).json({
        success: true,
        data: camera,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async recordHeartbeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = cameraHeartbeatSchema.parse(req.body);
      const result = await CCTVService.recordHeartbeat(req.params.id, validatedInput);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSecureStreamAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = generateStreamTokenSchema.parse(req.body || {});
      const streamAccess = await CCTVService.getSecureStreamAccess(
        req.params.id,
        validatedInput.ttlSeconds,
        (req as any).user,
        req.ip,
        req.headers['user-agent'],
      );
      res.status(200).json({
        success: true,
        data: streamAccess,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getLiveFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const camera = await CCTVService.getCameraById(req.params.id);
      
      // Return safe standard HLS demo or proxy playlist
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      const mockHlsManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:4.000000,
/api/v1/cctv/demo/segment0.ts
#EXTINF:4.000000,
/api/v1/cctv/demo/segment1.ts
#EXT-X-ENDLIST`;

      res.status(200).send(mockHlsManifest);
    } catch (error) {
      next(error);
    }
  }

  public static async updateCamera(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = updateCCTVCameraSchema.parse(req.body);
      const updated = await CCTVService.updateCamera(
        req.params.id,
        validatedInput,
        (req as any).user,
      );
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCamera(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await CCTVService.deleteCamera(req.params.id, (req as any).user);
      res.status(200).json({
        success: true,
        message: 'CCTV Camera removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

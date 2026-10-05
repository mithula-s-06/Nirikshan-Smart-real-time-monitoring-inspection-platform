import { Request, Response, NextFunction } from 'express';
import http from 'http';
import https from 'https';
import { CCTVService } from '../services/cctv.service';
import {
  createCCTVCameraSchema,
  updateCCTVCameraSchema,
  cameraHeartbeatSchema,
  generateStreamTokenSchema,
  getCCTVQuerySchema,
} from '@nirikshan/validation';
import { CCTVCamera } from '../models/cctvCamera.model';
import { CameraStatus } from '@nirikshan/shared-types';

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

  /**
   * Universal HTTP / MJPEG stream proxy for Android mobile phone cameras and local IP streams
   */
  public static proxyStream(targetUrl: string, req: Request, res: Response): void {
    try {
      let parsed = new URL(targetUrl);
      if (!parsed.pathname || parsed.pathname === '/' || parsed.pathname === '') {
        parsed.pathname = '/video';
        targetUrl = parsed.toString();
      }
      const client = parsed.protocol === 'https:' ? https : http;
      const requestOptions: any = {
        timeout: 8000,
      };
      if (parsed.protocol === 'https:') {
        requestOptions.rejectUnauthorized = false;
      }

      const streamReq = client.get(targetUrl, requestOptions, (streamRes) => {
        const contentType =
          streamRes.headers['content-type'] || 'multipart/x-mixed-replace; boundary=boundarydonotcross';
        res.writeHead(streamRes.statusCode || 200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'Access-Control-Allow-Origin': '*',
        });

        streamRes.pipe(res);

        req.on('close', () => {
          streamRes.destroy();
          streamReq.destroy();
        });
      });

      streamReq.on('timeout', () => {
        streamReq.destroy();
        if (!res.headersSent) {
          res.status(504).json({
            success: false,
            error: {
              code: 'CAMERA_TIMEOUT',
              message: `Connection to mobile camera timed out at ${targetUrl}. Ensure phone is on the same Wi-Fi.`,
            },
          });
        }
      });

      streamReq.on('error', (err) => {
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            error: {
              code: 'CAMERA_UNREACHABLE',
              message: `Could not connect to mobile IP camera at ${targetUrl}: ${err.message}.`,
            },
          });
        }
      });
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STREAM_URL',
            message: `Invalid mobile camera URL: ${err.message}`,
          },
        });
      }
    }
  }

  /**
   * Direct proxy endpoint for the configured mobile phone IP camera
   */
  public static async getMobileStream(req: Request, res: Response): Promise<void> {
    const targetUrl =
      (req.query.url as string) || process.env.MOBILE_CCTV_STREAM_URL || 'http://10.146.163.75:8080/video';
    CCTVController.proxyStream(targetUrl, req, res);
  }

  /**
   * Return CCTV and mobile IP camera configuration
   */
  public static async getConfig(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        mobileStreamUrl: process.env.MOBILE_CCTV_STREAM_URL || 'http://10.146.163.75:8080/video',
        supportedProtocols: ['MJPEG', 'HTTP', 'HLS', 'RTSP'],
      },
    });
  }

  /**
   * Update mobile IP camera URL on the fly
   */
  public static async updateConfig(req: Request, res: Response): Promise<void> {
    let { mobileStreamUrl } = req.body;
    if (mobileStreamUrl) {
      let trimmed = String(mobileStreamUrl).trim();
      try {
        const parsed = new URL(trimmed);
        if (!parsed.pathname || parsed.pathname === '/' || parsed.pathname === '') {
          parsed.pathname = '/video';
        }
        trimmed = parsed.toString();
      } catch (e) {
        if (!trimmed.includes('/', 8)) trimmed += '/video';
      }
      process.env.MOBILE_CCTV_STREAM_URL = trimmed;
      await CCTVCamera.updateMany(
        { $or: [{ code: { $regex: /MOB/i } }, { protocol: 'MJPEG' }] },
        { $set: { rawStreamUrl: trimmed, status: CameraStatus.ONLINE } },
      );
    }
    res.status(200).json({
      success: true,
      message: 'Mobile camera configuration updated successfully',
      data: {
        mobileStreamUrl: process.env.MOBILE_CCTV_STREAM_URL || 'http://10.146.163.75:8080/video',
      },
    });
  }

  public static async getLiveFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const camera = await CCTVService.getCameraById(req.params.id);

      // If camera is configured with a live HTTP/MJPEG URL (e.g. mobile phone stream), proxy it
      if (
        (camera as any).rawStreamUrl &&
        ((camera as any).rawStreamUrl.startsWith('http://') ||
          (camera as any).rawStreamUrl.startsWith('https://'))
      ) {
        return CCTVController.proxyStream((camera as any).rawStreamUrl, req, res);
      }

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

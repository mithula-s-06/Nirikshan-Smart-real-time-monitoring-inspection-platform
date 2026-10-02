import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '@nirikshan/shared-types';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  public static async login(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ip = req.ip;
      const userAgent = req.get('user-agent');
      const requestId = req.id;

      const result = await AuthService.login({ email, password }, ip, userAgent, requestId);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result,
        meta: {
          requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  public static async refresh(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const ip = req.ip;
      const userAgent = req.get('user-agent');
      const requestId = req.id;

      const tokens = await AuthService.refresh(refreshToken, ip, userAgent, requestId);

      res.status(200).json({
        success: true,
        message: 'Session tokens refreshed successfully',
        data: { tokens },
        meta: {
          requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  public static async logout(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const ip = req.ip;
      const userAgent = req.get('user-agent');
      const requestId = req.id;

      await AuthService.logout(refreshToken, req.user, ip, userAgent, requestId);

      res.status(200).json({
        success: true,
        message: 'Successfully logged out',
        meta: {
          requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  public static async getMe(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      const userProfile = await AuthService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: { user: userProfile },
        meta: {
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/users (Admin user creation)
   */
  public static async createUser(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const newUser = await AuthService.createUser(
        req.body,
        req.user,
        req.ip,
        req.get('user-agent'),
        req.id,
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: newUser },
        meta: {
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

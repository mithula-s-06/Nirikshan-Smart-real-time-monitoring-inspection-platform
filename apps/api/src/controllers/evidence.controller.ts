import { Request, Response, NextFunction } from 'express';
import { EvidenceService } from '../services/evidence.service';
import { getStorageProvider } from '../storage';
import { uploadEvidenceMetadataSchema } from '@nirikshan/validation';
import { EvidenceType, UserRole } from '@nirikshan/shared-types';

export class EvidenceController {
  /**
   * POST /api/v1/inspections/:id/evidence
   * Uploads and cryptographically hashes an inspection evidence file
   */
  public static async uploadEvidence(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const inspectionId = req.params.id;
      const file = req.file;

      const validatedMetadata = uploadEvidenceMetadataSchema.parse(req.body);

      const evidence = await EvidenceService.uploadEvidence(
        inspectionId,
        req.user!.id,
        req.user!.role,
        file!,
        validatedMetadata,
        req.ip,
        req.get('user-agent'),
      );

      res.status(201).json({
        success: true,
        message: 'Evidence asset uploaded, cryptographically hashed, and verified successfully.',
        data: { evidence },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/inspections/:id/evidence
   * Retrieves all evidence assets for an inspection
   */
  public static async getInspectionEvidence(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const inspectionId = req.params.id;
      const type = req.query.type as EvidenceType | undefined;

      const evidence = await EvidenceService.getEvidenceForInspection(inspectionId, type);

      res.status(200).json({
        success: true,
        message: `Retrieved ${evidence.length} evidence records`,
        data: { evidence },
        meta: { count: evidence.length, requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/evidence/:id
   * Retrieves a single evidence metadata record
   */
  public static async getEvidenceById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const evidence = await EvidenceService.getEvidenceById(req.params.id);

      res.status(200).json({
        success: true,
        data: { evidence },
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/evidence/:id/verify-hash
   * Verifies SHA-256 integrity of evidence file
   */
  public static async verifyIntegrity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await EvidenceService.verifyEvidenceIntegrity(req.params.id);

      res.status(200).json({
        success: true,
        message: result.isTamperFree
          ? 'Evidence cryptographic integrity verified: 0 tamper detected.'
          : '⚠️ INTEGRITY WARNING: SHA-256 hash mismatch detected! Evidence may have been altered.',
        data: result,
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/evidence/:id/stream
   * Streams the underlying binary asset
   */
  public static async streamFile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const evidence = await EvidenceService.getEvidenceById(req.params.id);
      const storage = getStorageProvider();

      const stream = await storage.getFileStream(evidence.fileKey);

      res.setHeader('Content-Type', evidence.mimeType);
      res.setHeader('Content-Length', evidence.fileSize);
      res.setHeader('Content-Disposition', `inline; filename="${evidence.fileKey.split('/').pop()}"`);

      (stream as any).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/evidence/:id
   * Deletes an evidence asset
   */
  public static async deleteEvidence(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await EvidenceService.deleteEvidence(req.params.id, req.user!.id, req.user!.role);

      res.status(200).json({
        success: true,
        message: 'Evidence asset deleted successfully.',
        meta: { requestId: req.id },
      });
    } catch (error) {
      next(error);
    }
  }
}

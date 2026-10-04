/**
 * faceVerification.service.ts
 * ---------------------------
 * Calls the NIRIKSHAN Unified AI Service (Python/FastAPI, port 8000) for:
 *   - POST /api/v1/face/analyze    → quality gate + YuNet face detection + SFace embeddings
 *   - POST /api/v1/face/deduplicate → cosine-similarity cross-photo deduplication
 *
 * Uses Node.js 18+ native fetch and FormData (no extra packages needed).
 *
 * Used by:
 *   - EvidenceService.uploadEvidence() for automatic face-count on photo evidence
 *   - HealthController for live AI service probe
 */

import { env } from '../config/env';
import { logger } from '../utils/logger';

const AI_BASE = env.AI_SERVICE_URL; // e.g. http://127.0.0.1:8000

export interface FaceQuality {
  blur: number;
  brightness: number;
  width: number;
  height: number;
  ok: boolean;
  reason: string;
}

export interface DetectedFace {
  bbox: [number, number, number, number];
  score: number;
  embedding: number[];
  width: number;
  height: number;
}

export interface FaceAnalysisResult {
  quality: FaceQuality;
  faceCount: number;
  faces: DetectedFace[];
}

export interface DedupeResult {
  totalInputFaces: number;
  uniqueFaceCount: number;
  uniqueFaces: DetectedFace[];
}

export class FaceVerificationService {
  /**
   * Sends a raw image buffer to the AI service for quality + face detection.
   * Returns null (with a warning log) if the AI service is unreachable so that
   * the evidence upload still succeeds — this is a best-effort enrichment.
   */
  public static async analyzeImage(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<FaceAnalysisResult | null> {
    try {
      // Native FormData + Blob (Node.js 18+)
      const form = new FormData();
      const blob = new Blob([fileBuffer], { type: mimeType });
      form.append('image', blob, fileName);

      const response = await fetch(`${AI_BASE}/api/v1/face/analyze`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        logger.warn(
          { status: response.status, url: `${AI_BASE}/api/v1/face/analyze` },
          '⚠️  AI face analysis returned non-OK status',
        );
        return null;
      }

      return (await response.json()) as FaceAnalysisResult;
    } catch (err: any) {
      logger.warn(
        { err: err?.message },
        '⚠️  AI face service unreachable — skipping face analysis (evidence upload continues)',
      );
      return null;
    }
  }

  /**
   * De-duplicates faces across multiple photos in the same attendance session.
   * Embeddings must already be unit-normalised (the AI service guarantees this).
   */
  public static async deduplicateFaces(
    allFaces: DetectedFace[],
    threshold = 0.48,
  ): Promise<DedupeResult | null> {
    try {
      const response = await fetch(`${AI_BASE}/api/v1/face/deduplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allFaces, threshold }),
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) return null;
      return (await response.json()) as DedupeResult;
    } catch (err: any) {
      logger.warn({ err: err?.message }, '⚠️  AI deduplication service unreachable');
      return null;
    }
  }

  /**
   * Checks if the AI service is reachable (used in health endpoint).
   */
  public static async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${AI_BASE}/health`, {
        signal: AbortSignal.timeout(3_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

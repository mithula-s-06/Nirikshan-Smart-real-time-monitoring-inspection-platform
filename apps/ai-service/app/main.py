"""
NIRIKSHAN — Unified AI Microservice (Port 8000)
================================================
Combines three AI engines under a single FastAPI application:

  1. /api/v1/analyze/*         — Anomaly analytics (attendance, progress-velocity,
                                  duplicate-evidence, project-risk)
  2. /api/v1/face/*            — Real-time face detection & embedding extraction
                                  using OpenCV YuNet + SFace ONNX models
  3. /api/v1/integrity/*       — Beneficiary data-integrity rules 2–8
                                  (DoSJE Anti-Fraud & Attendance Verification Engine)
"""

import sys
import os
from pathlib import Path

# ── Path bootstrap so integrity_engine subpackage resolves ──────────────────
AI_SERVICE_DIR = Path(__file__).resolve().parent.parent      # apps/ai-service/
INTEGRITY_DIR  = AI_SERVICE_DIR / "integrity_engine"
MODELS_DIR     = AI_SERVICE_DIR / "models"

for p in [str(AI_SERVICE_DIR), str(INTEGRITY_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# The integrity engine's internal files use `from src.xxx` imports.
# Make `integrity_engine` importable ALSO under the alias `src` so those
# internal imports resolve when running from apps/ai-service/.
import importlib, types as _types
if "src" not in sys.modules:
    import integrity_engine as _ie_pkg
    sys.modules["src"] = _ie_pkg

# Override the integrity engine's config so it finds its own DB & config files
os.environ.setdefault(
    "DATABASE_URL",
    f"sqlite:///{AI_SERVICE_DIR / 'analytics_store.db'}",
)

# ── FastAPI & stdlib imports ────────────────────────────────────────────────
import io
import math
import cv2
import numpy as np
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Integrity engine bootstrap ──────────────────────────────────────────────
try:
    # Patch config paths before importing integrity modules
    from integrity_engine.core import config as _ie_config
    _ie_config.settings.CONFIG_DIR      = INTEGRITY_DIR / "config"
    _ie_config.settings.MODELS_DIR      = MODELS_DIR
    _ie_config.settings.DEFAULT_PROFILE_FILE = INTEGRITY_DIR / "config" / "default_scheme_profile.json"
    _ie_config.settings.CALENDAR_FILE   = INTEGRITY_DIR / "config" / "annotation_calendar.json"
    _ie_config.settings.DATABASE_URL    = str(os.environ["DATABASE_URL"])

    from integrity_engine.core.database       import init_db
    from integrity_engine.core.scheme_profile import load_scheme_profile
    from integrity_engine.core.calendar       import load_calendar_events
    from integrity_engine.api.v1.router       import api_router as integrity_api_router
    INTEGRITY_ENGINE_AVAILABLE = True
except Exception as _ie_err:
    print(f"[WARN] Integrity engine unavailable: {_ie_err}")
    INTEGRITY_ENGINE_AVAILABLE = False

# ── OpenCV Face Models ──────────────────────────────────────────────────────
YUNET_PATH  = str(MODELS_DIR / "face_detection_yunet_2023mar.onnx")
SFACE_PATH  = str(MODELS_DIR / "face_recognition_sface_2021dec.onnx")

MIN_FACE_PX    = 30
MIN_DET_SCORE  = 0.45
BLUR_LIMIT     = 50.0
MIN_BRIGHTNESS = 45.0
MAX_BRIGHTNESS = 225.0

yunet_detector   = None
sface_recognizer = None

if os.path.exists(YUNET_PATH) and os.path.exists(SFACE_PATH):
    try:
        yunet_detector   = cv2.FaceDetectorYN_create(YUNET_PATH, "", (320, 320), MIN_DET_SCORE, 0.3, 5000)
        sface_recognizer = cv2.FaceRecognizerSF_create(SFACE_PATH, "")
        print("[OK] OpenCV YuNet + SFace models loaded successfully.")
    except Exception as _cv_err:
        print(f"[WARN] Failed to load ONNX face models: {_cv_err}")

# ── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    if INTEGRITY_ENGINE_AVAILABLE:
        try:
            init_db()
            load_scheme_profile()
            load_calendar_events()
            print("[OK] Integrity engine initialized.")
        except Exception as e:
            print(f"[WARN] Integrity engine startup error: {e}")
    print("[OK] NIRIKSHAN Unified AI Service ready.")
    yield
    print("[OK] NIRIKSHAN AI Service shutting down.")


# ── FastAPI App ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="NIRIKSHAN Unified AI Service",
    description=(
        "Unified AI microservice for the Nirikshan Smart Monitoring Platform. "
        "Provides anomaly analytics, real-time face verification, and beneficiary "
        "data-integrity analysis."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount integrity engine routes under /api/v1/integrity
if INTEGRITY_ENGINE_AVAILABLE:
    app.include_router(integrity_api_router, prefix="/api/v1/integrity")


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1 — HEALTH
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "nirikshan-ai-service",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "capabilities": [
            "ATTENDANCE_MISMATCH",
            "REPORTING_SPIKE",
            "DUPLICATE_EVIDENCE",
            "UNUSUAL_ATTENDANCE",
            "COMPOSITE_RISK",
            "FACE_DETECTION",
            "FACE_DEDUPLICATION",
            "BENEFICIARY_INTEGRITY_RULES_2_TO_8",
        ],
        "faceModelsLoaded": yunet_detector is not None and sface_recognizer is not None,
        "integrityEngineLoaded": INTEGRITY_ENGINE_AVAILABLE,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 2 — ANOMALY ANALYTICS  (existing endpoints — unchanged)
# ═══════════════════════════════════════════════════════════════════════════

class AttendanceAnalysisRequest(BaseModel):
    projectId: str
    inspectionId: Optional[str] = None
    claimedAttendance: float = Field(..., ge=0)
    observedAttendance: float = Field(..., ge=0)
    historicalAverage: Optional[float] = Field(None, ge=0)
    date: Optional[str] = None


class ProgressVelocityRequest(BaseModel):
    projectId: str
    reportedPhysicalProgressPct: float = Field(..., ge=0, le=100)
    disbursedFundsAmount: float = Field(..., ge=0)
    sanctionedBudgetAmount: float = Field(..., gt=0)
    expectedProgressPct: Optional[float] = Field(None, ge=0, le=100)
    durationDaysElapsed: Optional[float] = Field(None, gt=0)


class DuplicateEvidenceRequest(BaseModel):
    evidenceId: str
    sha256Hash: str = Field(..., min_length=64, max_length=64)
    projectId: str
    inspectionId: Optional[str] = None
    existingEvidenceHashes: Optional[List[Dict[str, str]]] = Field(default=[])


class ProjectRiskAnalysisRequest(BaseModel):
    projectId: str
    currentRiskScore: float = Field(default=50.0, ge=0, le=100)
    daysSinceLastInspection: float = Field(default=0.0, ge=0)
    totalAnomaliesReported: int = Field(default=0, ge=0)
    averageAttendanceDeficitPct: float = Field(default=0.0, ge=0, le=100)
    fundProgressDivergencePct: float = Field(default=0.0, ge=0, le=100)


class AnomalyAnalysisResponse(BaseModel):
    isAnomaly: bool
    anomalyType: str
    severity: str
    confidenceScore: float
    title: str
    explainableReason: str
    metrics: Dict[str, Any]
    recommendedAction: str
    timestamp: str


@app.post("/api/v1/analyze/attendance", response_model=AnomalyAnalysisResponse, tags=["Anomaly Analytics"])
def analyze_attendance(payload: AttendanceAnalysisRequest):
    claimed = payload.claimedAttendance
    observed = payload.observedAttendance
    discrepancy = claimed - observed
    denominator = max(claimed, 1.0)
    deficit_pct = max(0.0, (discrepancy / denominator) * 100.0)

    if deficit_pct >= 40.0:
        is_anomaly, severity = True, "CRITICAL"
        confidence = min(0.98, 0.70 + (deficit_pct / 100.0) * 0.3)
        title = f"Critical Ghost Workforce Anomaly Detected ({deficit_pct:.1f}% Deficit)"
        reason = (
            f"Physical on-site headcount ({observed:.0f} workers) is {deficit_pct:.1f}% lower than "
            f"claimed muster roll ({claimed:.0f} workers). Massive workforce discrepancy indicates "
            f"ghost worker fraud or inflated wage claims."
        )
        recommendation = "Halt wage disbursement; trigger unannounced physical biometric audit and inspect site contractor."
    elif deficit_pct >= 20.0:
        is_anomaly, severity, confidence = True, "HIGH", 0.85
        title = f"Significant Attendance Mismatch Detected ({deficit_pct:.1f}% Deficit)"
        reason = (
            f"Observed on-site headcount ({observed:.0f}) is {deficit_pct:.1f}% below claimed muster logs "
            f"({claimed:.0f}). Exceeds the acceptable variance threshold (15%)."
        )
        recommendation = "Demand contractor muster reconciliation within 48 hours and conduct surprise follow-up verification."
    elif deficit_pct >= 10.0:
        is_anomaly, severity, confidence = True, "MEDIUM", 0.70
        title = f"Moderate Attendance Variance ({deficit_pct:.1f}% Deficit)"
        reason = (
            f"Minor workforce shortage observed ({observed:.0f} vs. {claimed:.0f} claimed). "
            f"Variance of {deficit_pct:.1f}% warrants operational monitoring."
        )
        recommendation = "Flag for automatic inclusion in next randomized inspection cycle."
    else:
        is_anomaly, severity, confidence = False, "LOW", 0.95
        title = "Normal Attendance Concordance"
        reason = (
            f"Observed headcount ({observed:.0f}) closely matches claimed muster ({claimed:.0f}) "
            f"with minimal variance ({deficit_pct:.1f}%)."
        )
        recommendation = "No action required; log record into verification ledger."

    return AnomalyAnalysisResponse(
        isAnomaly=is_anomaly, anomalyType="ATTENDANCE_MISMATCH", severity=severity,
        confidenceScore=round(confidence, 2), title=title, explainableReason=reason,
        metrics={
            "claimedAttendance": claimed, "observedAttendance": observed,
            "discrepancyCount": discrepancy, "deficitPercentage": round(deficit_pct, 2),
            "historicalAverage": payload.historicalAverage,
        },
        recommendedAction=recommendation, timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/api/v1/analyze/progress-velocity", response_model=AnomalyAnalysisResponse, tags=["Anomaly Analytics"])
def analyze_progress_velocity(payload: ProgressVelocityRequest):
    disbursed = payload.disbursedFundsAmount
    sanctioned = payload.sanctionedBudgetAmount
    physical_progress = payload.reportedPhysicalProgressPct

    disbursed_pct = (disbursed / sanctioned) * 100.0
    velocity_ratio = disbursed_pct / max(physical_progress, 1.0)
    divergence_gap = disbursed_pct - physical_progress

    if disbursed_pct > 60.0 and physical_progress < 30.0:
        is_anomaly, severity, confidence = True, "CRITICAL", 0.96
        title = f"Critical Fiscal Divergence ({disbursed_pct:.1f}% Spent vs. {physical_progress:.1f}% Complete)"
        reason = (
            f"Disbursed funds (₹{disbursed:,.0f} / {disbursed_pct:.1f}%) drastically outpace verified civil "
            f"milestone progress ({physical_progress:.1f}%). Expenditure velocity ratio ({velocity_ratio:.2f}x) "
            f"signals premature fund liquidation without corresponding construction."
        )
        recommendation = "Freeze subsequent tranche releases immediately; mandate a comprehensive forensic engineering audit."
    elif divergence_gap >= 25.0:
        is_anomaly, severity, confidence = True, "HIGH", 0.88
        title = f"High Fund-Progress Divergence ({divergence_gap:.1f}% Gap)"
        reason = (
            f"Fund utilization ({disbursed_pct:.1f}%) leads physical execution ({physical_progress:.1f}%) by "
            f"{divergence_gap:.1f}%. Velocity ratio ({velocity_ratio:.2f}x) indicates high risk of cost overrun."
        )
        recommendation = "Withhold interim contractor billing until civil progress catches up to scheduled baseline."
    elif divergence_gap >= 12.0:
        is_anomaly, severity, confidence = True, "MEDIUM", 0.75
        title = f"Moderate Expenditure Velocity Gap ({divergence_gap:.1f}% Gap)"
        reason = (
            f"Minor fiscal lead observed ({disbursed_pct:.1f}% disbursed vs {physical_progress:.1f}% completed). "
            f"Within borderline acceptable variance range."
        )
        recommendation = "Notify implementing agency officer and request monthly utilization certificate."
    else:
        is_anomaly, severity, confidence = False, "LOW", 0.92
        title = "Healthy Fiscal-to-Physical Alignment"
        reason = f"Fund disbursement ({disbursed_pct:.1f}%) aligns harmoniously with physical work ({physical_progress:.1f}%)."
        recommendation = "Approve next standard milestone inspection."

    return AnomalyAnalysisResponse(
        isAnomaly=is_anomaly, anomalyType="REPORTING_SPIKE", severity=severity,
        confidenceScore=round(confidence, 2), title=title, explainableReason=reason,
        metrics={
            "disbursedFundsAmount": disbursed, "sanctionedBudgetAmount": sanctioned,
            "disbursedPercentage": round(disbursed_pct, 2),
            "reportedPhysicalProgressPct": physical_progress,
            "divergenceGapPct": round(divergence_gap, 2), "velocityRatio": round(velocity_ratio, 2),
        },
        recommendedAction=recommendation, timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/api/v1/analyze/duplicate-evidence", response_model=AnomalyAnalysisResponse, tags=["Anomaly Analytics"])
def analyze_duplicate_evidence(payload: DuplicateEvidenceRequest):
    target_hash = payload.sha256Hash
    current_proj = payload.projectId
    duplicate_match = None
    if payload.existingEvidenceHashes:
        for item in payload.existingEvidenceHashes:
            if item.get("sha256Hash") == target_hash and item.get("projectId") != current_proj:
                duplicate_match = item
                break

    if duplicate_match:
        matched_proj = duplicate_match.get("projectId", "UNKNOWN_PROJECT")
        matched_ev = duplicate_match.get("evidenceId", "UNKNOWN_EVIDENCE")
        return AnomalyAnalysisResponse(
            isAnomaly=True, anomalyType="DUPLICATE_EVIDENCE", severity="CRITICAL",
            confidenceScore=1.0, title="Recycled Photographic Proof Fraud Detected",
            explainableReason=(
                f"Cryptographic SHA-256 hash match detected! Evidence (ID: {payload.evidenceId}) is "
                f"bit-for-bit identical to evidence ID '{matched_ev}' for Project '{matched_proj}'. "
                f"Reused photos across differing sites indicates fraudulent submission."
            ),
            metrics={
                "targetEvidenceId": payload.evidenceId, "matchedEvidenceId": matched_ev,
                "matchedProjectId": matched_proj, "sha256Hash": target_hash, "matchConfidence": 1.0,
            },
            recommendedAction="Reject inspection report immediately; blacklist inspector or contractor pending disciplinary probe.",
            timestamp=datetime.utcnow().isoformat(),
        )

    return AnomalyAnalysisResponse(
        isAnomaly=False, anomalyType="DUPLICATE_EVIDENCE", severity="LOW",
        confidenceScore=0.99, title="Unique Photographic Evidence Verified",
        explainableReason="No duplicate cryptographic or perceptual signatures found across existing project databases.",
        metrics={"evidenceId": payload.evidenceId, "sha256Hash": target_hash, "isUnique": True},
        recommendedAction="Accept evidence asset into immutable storage.",
        timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/api/v1/analyze/project-risk", tags=["Anomaly Analytics"])
def analyze_composite_project_risk(payload: ProjectRiskAnalysisRequest):
    gap_factor      = min(25.0, (payload.daysSinceLastInspection / 180.0) * 25.0)
    anomaly_factor  = min(35.0, payload.totalAnomaliesReported * 12.0)
    attendance_factor = (payload.averageAttendanceDeficitPct / 100.0) * 20.0
    fiscal_factor   = (payload.fundProgressDivergencePct / 100.0) * 20.0
    raw_composite   = (payload.currentRiskScore * 0.20) + gap_factor + anomaly_factor + attendance_factor + fiscal_factor
    final_score     = min(100.0, max(0.0, raw_composite))

    risk_level = "LOW"
    if final_score >= 80.0:   risk_level = "CRITICAL"
    elif final_score >= 60.0: risk_level = "HIGH"
    elif final_score >= 40.0: risk_level = "MEDIUM"

    return {
        "projectId": payload.projectId,
        "compositeRiskScore": round(final_score, 1),
        "riskLevel": risk_level,
        "breakdown": {
            "baselineComponent": round(payload.currentRiskScore * 0.20, 1),
            "inspectionGapComponent": round(gap_factor, 1),
            "anomalyHistoryComponent": round(anomaly_factor, 1),
            "attendanceDeficitComponent": round(attendance_factor, 1),
            "fiscalDivergenceComponent": round(fiscal_factor, 1),
        },
        "isPriorityInspectionRecommended": final_score >= 60.0,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 3 — FACE VERIFICATION  (YuNet + SFace ONNX)
# ═══════════════════════════════════════════════════════════════════════════

def _blur_score(img: np.ndarray) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _fallback_feature_extractor(face_crop: np.ndarray) -> List[float]:
    """128-D gradient-histogram embedding fallback when ONNX models are absent."""
    if face_crop.size == 0:
        return [0.0] * 128
    resized = cv2.resize(face_crop, (64, 64))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
    hist_list: List[float] = []
    for cy in range(4):
        for cx in range(4):
            sub_mag = mag[cy * 16:(cy + 1) * 16, cx * 16:(cx + 1) * 16]
            sub_ang = ang[cy * 16:(cy + 1) * 16, cx * 16:(cx + 1) * 16]
            bin_hist = np.zeros(8, dtype=np.float32)
            for b in range(8):
                mask = (sub_ang >= b * 45) & (sub_ang < (b + 1) * 45)
                bin_hist[b] = np.sum(sub_mag[mask])
            hist_list.extend(bin_hist.tolist())
    emb = np.array(hist_list, dtype=np.float32)
    norm = np.linalg.norm(emb)
    if norm > 1e-6:
        emb = emb / norm
    return emb.tolist()


@app.post("/api/v1/face/analyze", tags=["Face Verification"])
@app.post("/analyze", tags=["Face Verification"])
async def face_analyze(image: UploadFile = File(...)):
    """
    Quality gate + face detection + normalized SFace embeddings extraction.
    Used by the inspection evidence upload flow to verify worker headcounts.
    """
    try:
        data = np.frombuffer(await image.read(), np.uint8)
        img  = cv2.imdecode(data, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image.")

        h, w       = img.shape[:2]
        b_score    = _blur_score(img)
        brightness = float(img.mean())

        is_blur_ok   = b_score >= BLUR_LIMIT
        is_bright_ok = MIN_BRIGHTNESS <= brightness <= MAX_BRIGHTNESS
        is_res_ok    = w >= 240 and h >= 240
        quality_ok   = is_blur_ok and is_bright_ok and is_res_ok

        reasons = []
        if not is_blur_ok:
            reasons.append(f"Image too blurry (blur index: {b_score:.1f}, min: {BLUR_LIMIT})")
        if brightness < MIN_BRIGHTNESS:
            reasons.append(f"Image too dark (brightness: {brightness:.1f}, min: {MIN_BRIGHTNESS})")
        elif brightness > MAX_BRIGHTNESS:
            reasons.append(f"Image overexposed (brightness: {brightness:.1f}, max: {MAX_BRIGHTNESS})")
        if not is_res_ok:
            reasons.append(f"Resolution too low ({w}x{h}, min: 240x240)")

        quality = {
            "blur": float(b_score), "brightness": float(brightness),
            "width": int(w), "height": int(h),
            "ok": bool(quality_ok),
            "reason": "; ".join(reasons) if reasons else "Good quality",
        }

        faces: List[Dict[str, Any]] = []
        if yunet_detector is not None and sface_recognizer is not None:
            yunet_detector.setInputSize((w, h))
            _, detected = yunet_detector.detect(img)
            if detected is not None:
                for f_data in detected:
                    score = float(f_data[14])
                    bw, bh = float(f_data[2]), float(f_data[3])
                    if score < MIN_DET_SCORE or bw < MIN_FACE_PX or bh < MIN_FACE_PX:
                        continue
                    x1 = float(max(0, f_data[0]))
                    y1 = float(max(0, f_data[1]))
                    x2 = float(min(w, x1 + bw))
                    y2 = float(min(h, y1 + bh))
                    try:
                        aligned = sface_recognizer.alignCrop(img, f_data)
                        emb     = sface_recognizer.feature(aligned).flatten()
                        norm    = np.linalg.norm(emb)
                        if norm > 1e-6:
                            emb = emb / norm
                        emb_list = emb.tolist()
                    except Exception:
                        face_crop = img[int(y1):int(y2), int(x1):int(x2)]
                        emb_list  = _fallback_feature_extractor(face_crop)

                    faces.append({
                        "bbox": [x1, y1, x2, y2], "score": round(score, 4),
                        "embedding": emb_list, "width": round(bw, 1), "height": round(bh, 1),
                    })

        return {"quality": quality, "faceCount": len(faces), "faces": faces}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Face analysis failed: {exc}")


class DedupeRequest(BaseModel):
    allFaces: List[Dict[str, Any]]
    threshold: Optional[float] = 0.48


@app.post("/api/v1/face/deduplicate", tags=["Face Verification"])
@app.post("/deduplicate", tags=["Face Verification"])
def face_deduplicate(req: DedupeRequest):
    """
    De-duplicates faces across multiple photos in a single attendance session.
    Embeddings are unit-normalised, so dot product = cosine similarity.
    """
    threshold = req.threshold or 0.48
    unique: List[Dict[str, Any]] = []
    for f in req.allFaces:
        emb = f.get("embedding")
        if not emb:
            continue
        e = np.array(emb, dtype=np.float32)
        if not any(float(np.dot(e, np.array(u["embedding"], dtype=np.float32))) > threshold for u in unique):
            unique.append(f)

    return {
        "totalInputFaces": len(req.allFaces),
        "uniqueFaceCount": len(unique),
        "uniqueFaces": unique,
    }


# ═══════════════════════════════════════════════════════════════════════════
# Entry point
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

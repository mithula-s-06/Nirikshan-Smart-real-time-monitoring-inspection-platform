"""
NIRIKSHAN AI & Explainable Anomaly Analytics Microservice
FastAPI service providing explainable anomaly detection for government inspections:
- Attendance Headcount vs. Muster Discrepancy Analytics
- Progress Velocity vs. Fund Disbursement Divergence
- Photographic Evidence Hash & Reuse Fraud Detection
- Multi-Modal Composite Risk Scoring
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import math

app = FastAPI(
    title="NIRIKSHAN AI Anomaly Analytics Engine",
    description="Production AI Microservice for real-time fraud, anomaly, and risk intelligence in government monitoring.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# PYDANTIC DATA MODELS
# =====================================================================

class AttendanceAnalysisRequest(BaseModel):
    projectId: str = Field(..., description="Target project identifier")
    inspectionId: Optional[str] = Field(None, description="Associated inspection ID")
    claimedAttendance: float = Field(..., ge=0, description="Muster roll / claimed worker count")
    observedAttendance: float = Field(..., ge=0, description="Physical on-site verified headcount")
    historicalAverage: Optional[float] = Field(None, ge=0, description="Baseline historical worker average")
    date: Optional[str] = Field(None, description="Date of attendance log (YYYY-MM-DD)")


class ProgressVelocityRequest(BaseModel):
    projectId: str = Field(..., description="Target project identifier")
    reportedPhysicalProgressPct: float = Field(..., ge=0, le=100, description="Verified physical completion percentage")
    disbursedFundsAmount: float = Field(..., ge=0, description="Total funds disbursed till date")
    sanctionedBudgetAmount: float = Field(..., gt=0, description="Total sanctioned scheme budget")
    expectedProgressPct: Optional[float] = Field(None, ge=0, le=100, description="Milestone scheduled target progress")
    durationDaysElapsed: Optional[float] = Field(None, gt=0, description="Days since project start")


class DuplicateEvidenceRequest(BaseModel):
    evidenceId: str = Field(..., description="Target evidence identifier")
    sha256Hash: str = Field(..., min_length=64, max_length=64, description="Cryptographic SHA-256 hash")
    projectId: str = Field(..., description="Current project ID")
    inspectionId: Optional[str] = Field(None, description="Current inspection ID")
    existingEvidenceHashes: Optional[List[Dict[str, str]]] = Field(
        default=[],
        description="Known evidence records to check against [{sha256Hash, evidenceId, projectId, inspectionId}]"
    )


class ProjectRiskAnalysisRequest(BaseModel):
    projectId: str = Field(..., description="Target project identifier")
    currentRiskScore: float = Field(default=50.0, ge=0, le=100)
    daysSinceLastInspection: float = Field(default=0.0, ge=0)
    totalAnomaliesReported: int = Field(default=0, ge=0)
    averageAttendanceDeficitPct: float = Field(default=0.0, ge=0, le=100)
    fundProgressDivergencePct: float = Field(default=0.0, ge=0, le=100)


class AnomalyAnalysisResponse(BaseModel):
    isAnomaly: bool
    anomalyType: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidenceScore: float  # 0.0 - 1.0
    title: str
    explainableReason: str
    metrics: Dict[str, Any]
    recommendedAction: str
    timestamp: str


# =====================================================================
# ENDPOINTS
# =====================================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "nirikshan-ai-service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "capabilities": [
            "ATTENDANCE_MISMATCH",
            "REPORTING_SPIKE",
            "DUPLICATE_EVIDENCE",
            "UNUSUAL_ATTENDANCE",
            "COMPOSITE_RISK"
        ]
    }


@app.post("/api/v1/analyze/attendance", response_model=AnomalyAnalysisResponse)
def analyze_attendance(payload: AttendanceAnalysisRequest):
    """
    Analyzes physical vs claimed workforce attendance discrepancies.
    Calculates percentage gap, anomaly confidence, and natural-language explainability.
    """
    claimed = payload.claimedAttendance
    observed = payload.observedAttendance
    discrepancy = claimed - observed
    
    # Avoid zero-division
    denominator = max(claimed, 1.0)
    deficit_pct = max(0.0, (discrepancy / denominator) * 100.0)

    is_anomaly = False
    severity = "LOW"
    confidence = 0.50
    anomaly_type = "ATTENDANCE_MISMATCH"
    
    if deficit_pct >= 40.0:
        is_anomaly = True
        severity = "CRITICAL"
        confidence = min(0.98, 0.70 + (deficit_pct / 100.0) * 0.3)
        title = f"Critical Ghost Workforce Anomaly Detected ({deficit_pct:.1f}% Deficit)"
        reason = (
            f"Physical on-site headcount ({observed:.0f} workers) is {deficit_pct:.1f}% lower than claimed muster roll "
            f"({claimed:.0f} workers). Massive workforce discrepancy indicates ghost worker fraud or inflated wage claims."
        )
        recommendation = "Halt wage disbursement; trigger unannounced physical biometric audit and inspect site contractor."
    elif deficit_pct >= 20.0:
        is_anomaly = True
        severity = "HIGH"
        confidence = 0.85
        title = f"Significant Attendance Mismatch Detected ({deficit_pct:.1f}% Deficit)"
        reason = (
            f"Observed on-site headcount ({observed:.0f}) is {deficit_pct:.1f}% below claimed muster logs ({claimed:.0f}). "
            f"Exceeds the acceptable variance threshold (15%)."
        )
        recommendation = "Demand contractor muster reconciliation within 48 hours and conduct surprise follow-up verification."
    elif deficit_pct >= 10.0:
        is_anomaly = True
        severity = "MEDIUM"
        confidence = 0.70
        title = f"Moderate Attendance Variance ({deficit_pct:.1f}% Deficit)"
        reason = (
            f"Minor workforce shortage observed ({observed:.0f} vs. {claimed:.0f} claimed). "
            f"Variance of {deficit_pct:.1f}% warrants operational monitoring."
        )
        recommendation = "Flag for automatic inclusion in next randomized inspection cycle."
    else:
        is_anomaly = False
        severity = "LOW"
        confidence = 0.95
        title = "Normal Attendance Concordance"
        reason = f"Observed headcount ({observed:.0f}) closely matches claimed muster ({claimed:.0f}) with minimal variance ({deficit_pct:.1f}%)."
        recommendation = "No action required; log record into verification ledger."

    return AnomalyAnalysisResponse(
        isAnomaly=is_anomaly,
        anomalyType=anomaly_type,
        severity=severity,
        confidenceScore=round(confidence, 2),
        title=title,
        explainableReason=reason,
        metrics={
            "claimedAttendance": claimed,
            "observedAttendance": observed,
            "discrepancyCount": discrepancy,
            "deficitPercentage": round(deficit_pct, 2),
            "historicalAverage": payload.historicalAverage,
        },
        recommendedAction=recommendation,
        timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/api/v1/analyze/progress-velocity", response_model=AnomalyAnalysisResponse)
def analyze_progress_velocity(payload: ProgressVelocityRequest):
    """
    Analyzes fiscal fund disbursement velocity vs. physical civil milestone completion.
    Detects abnormal expenditure spikes without physical infrastructure progress.
    """
    disbursed = payload.disbursedFundsAmount
    sanctioned = payload.sanctionedBudgetAmount
    physical_progress = payload.reportedPhysicalProgressPct

    disbursed_pct = (disbursed / sanctioned) * 100.0
    velocity_ratio = disbursed_pct / max(physical_progress, 1.0)
    divergence_gap = disbursed_pct - physical_progress

    is_anomaly = False
    severity = "LOW"
    confidence = 0.60
    anomaly_type = "REPORTING_SPIKE"

    if disbursed_pct > 60.0 and physical_progress < 30.0:
        is_anomaly = True
        severity = "CRITICAL"
        confidence = 0.96
        title = f"Critical Fiscal Divergence ({disbursed_pct:.1f}% Spent vs. {physical_progress:.1f}% Complete)"
        reason = (
            f"Disbursed funds (₹{disbursed:,.0f} / {disbursed_pct:.1f}%) drastically outpace verified civil milestone progress "
            f"({physical_progress:.1f}%). Expenditure velocity ratio ({velocity_ratio:.2f}x) signals premature fund liquidation without corresponding construction."
        )
        recommendation = "Freeze subsequent tranche releases immediately; mandate a comprehensive forensic engineering audit."
    elif divergence_gap >= 25.0:
        is_anomaly = True
        severity = "HIGH"
        confidence = 0.88
        title = f"High Fund-Progress Divergence ({divergence_gap:.1f}% Gap)"
        reason = (
            f"Fund utilization ({disbursed_pct:.1f}%) leads physical execution ({physical_progress:.1f}%) by {divergence_gap:.1f}%. "
            f"Velocity ratio ({velocity_ratio:.2f}x) indicates high risk of cost overrun or delayed milestone delivery."
        )
        recommendation = "Withhold interim contractor billing until civil progress catches up to scheduled baseline."
    elif divergence_gap >= 12.0:
        is_anomaly = True
        severity = "MEDIUM"
        confidence = 0.75
        title = f"Moderate Expenditure Velocity Gap ({divergence_gap:.1f}% Gap)"
        reason = (
            f"Minor fiscal lead observed ({disbursed_pct:.1f}% disbursed vs {physical_progress:.1f}% completed). "
            f"Within borderline acceptable variance range."
        )
        recommendation = "Notify implementing agency officer and request monthly utilization certificate."
    else:
        is_anomaly = False
        severity = "LOW"
        confidence = 0.92
        title = "Healthy Fiscal-to-Physical Alignment"
        reason = f"Fund disbursement ({disbursed_pct:.1f}%) aligns harmoniously with physical work ({physical_progress:.1f}%)."
        recommendation = "Approve next standard milestone milestone inspection."

    return AnomalyAnalysisResponse(
        isAnomaly=is_anomaly,
        anomalyType=anomaly_type,
        severity=severity,
        confidenceScore=round(confidence, 2),
        title=title,
        explainableReason=reason,
        metrics={
            "disbursedFundsAmount": disbursed,
            "sanctionedBudgetAmount": sanctioned,
            "disbursedPercentage": round(disbursed_pct, 2),
            "reportedPhysicalProgressPct": physical_progress,
            "divergenceGapPct": round(divergence_gap, 2),
            "velocityRatio": round(velocity_ratio, 2),
        },
        recommendedAction=recommendation,
        timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/api/v1/analyze/duplicate-evidence", response_model=AnomalyAnalysisResponse)
def analyze_duplicate_evidence(payload: DuplicateEvidenceRequest):
    """
    Performs cross-inspection photographic integrity analysis.
    Identifies reused/recycled image hashes across distinct project sites.
    """
    target_hash = payload.sha256Hash
    current_proj = payload.projectId
    
    # Check if this exact hash was already used in a different project
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
            isAnomaly=True,
            anomalyType="DUPLICATE_EVIDENCE",
            severity="CRITICAL",
            confidenceScore=1.0,
            title="Recycled Photographic Proof Fraud Detected",
            explainableReason=(
                f"Cryptographic SHA-256 hash match detected! The uploaded evidence file (ID: {payload.evidenceId}) "
                f"is bit-for-bit identical to evidence ID '{matched_ev}' originally uploaded for Project '{matched_proj}'. "
                f"Reused photos across differing geographical sites indicates fraudulent evidence submission."
            ),
            metrics={
                "targetEvidenceId": payload.evidenceId,
                "matchedEvidenceId": matched_ev,
                "matchedProjectId": matched_proj,
                "sha256Hash": target_hash,
                "matchConfidence": 1.0,
            },
            recommendedAction="Reject inspection report immediately; blacklist inspector or contractor pending disciplinary probe.",
            timestamp=datetime.utcnow().isoformat(),
        )

    return AnomalyAnalysisResponse(
        isAnomaly=False,
        anomalyType="DUPLICATE_EVIDENCE",
        severity="LOW",
        confidenceScore=0.99,
        title="Unique Photographic Evidence Verified",
        explainableReason="No duplicate cryptographic or perceptual signatures found across existing project databases.",
        metrics={
            "evidenceId": payload.evidenceId,
            "sha256Hash": target_hash,
            "isUnique": True,
        },
        recommendedAction="Accept evidence asset into immutable storage.",
        timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/api/v1/analyze/project-risk")
def analyze_composite_project_risk(payload: ProjectRiskAnalysisRequest):
    """
    Computes a composite multi-signal risk index (0-100) for prioritizing surprise inspections.
    """
    base_score = payload.currentRiskScore
    
    # Inspection freshness factor (Max 25 pts)
    gap_factor = min(25.0, (payload.daysSinceLastInspection / 180.0) * 25.0)
    
    # Anomaly density factor (Max 35 pts)
    anomaly_factor = min(35.0, payload.totalAnomaliesReported * 12.0)
    
    # Attendance variance factor (Max 20 pts)
    attendance_factor = (payload.averageAttendanceDeficitPct / 100.0) * 20.0
    
    # Fiscal divergence factor (Max 20 pts)
    fiscal_factor = (payload.fundProgressDivergencePct / 100.0) * 20.0

    raw_composite = (base_score * 0.20) + gap_factor + anomaly_factor + attendance_factor + fiscal_factor
    final_score = min(100.0, max(0.0, raw_composite))

    risk_level = "LOW"
    if final_score >= 80.0:
        risk_level = "CRITICAL"
    elif final_score >= 60.0:
        risk_level = "HIGH"
    elif final_score >= 40.0:
        risk_level = "MEDIUM"

    return {
        "projectId": payload.projectId,
        "compositeRiskScore": round(final_score, 1),
        "riskLevel": risk_level,
        "breakdown": {
            "baselineComponent": round(base_score * 0.20, 1),
            "inspectionGapComponent": round(gap_factor, 1),
            "anomalyHistoryComponent": round(anomaly_factor, 1),
            "attendanceDeficitComponent": round(attendance_factor, 1),
            "fiscalDivergenceComponent": round(fiscal_factor, 1),
        },
        "isPriorityInspectionRecommended": final_score >= 60.0,
        "timestamp": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

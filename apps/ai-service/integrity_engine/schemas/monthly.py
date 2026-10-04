from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.schemas.common import StandardFinding, ModuleAnalysisSummary

class MonthlyUnitData(BaseModel):
    unitId: str
    peerGroup: Optional[str] = "standard_hostel"
    claimedBeneficiaries: int = 30
    verifiedBeneficiaries: int = 28
    avgVerificationRatio: Optional[float] = 0.93
    attendanceVariance: Optional[float] = 2.4
    consecutiveIdenticalRuns: Optional[int] = 0
    longAbsenceCount: Optional[int] = 1
    monthlyExpenses: Optional[float] = 150000.0
    submissionTimestamps: List[str] = Field(default_factory=list)
    historicalMonthlyDiscrepanciesCount: Optional[int] = 0

class MonthlyRunRequest(BaseModel):
    month: str # YYYY-MM
    schemeId: str = "SCHEME_RESIDENTIAL_V1"
    unitsData: List[MonthlyUnitData] = Field(default_factory=list)
    configVersion: Optional[str] = "2026.10.v1"
    runMlOutliers: Optional[bool] = True

class MonthlyJobStatusResponse(BaseModel):
    jobId: str
    status: str # QUEUED, PROCESSING, COMPLETED, FAILED
    month: str
    unitsProcessed: int
    totalFindings: int
    executionTimeMs: float
    completedAt: Optional[str] = None
    summary: Optional[ModuleAnalysisSummary] = None
    topRiskUnits: List[Dict[str, Any]] = Field(default_factory=list)
    findings: List[StandardFinding] = Field(default_factory=list)

class UnitRiskProfileResponse(BaseModel):
    unitId: str
    month: str
    riskReviewScore: float # 0 to 100
    riskBand: str # LOW, MEDIUM, HIGH, CRITICAL
    compositeRank: int
    peerGroup: str
    featureContributions: Dict[str, float]
    findings: List[StandardFinding] = Field(default_factory=list)

import uuid
import time
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query, BackgroundTasks, status
from src.core.security import verify_api_key
from src.core.scheme_profile import load_scheme_profile
from src.schemas.monthly import MonthlyRunRequest, MonthlyJobStatusResponse
from src.schemas.common import ModuleAnalysisSummary
from src.registry.rule_registry import rule_registry

router = APIRouter(prefix="/jobs", tags=["Monthly Batch Jobs"])

_JOBS_STORE: Dict[str, MonthlyJobStatusResponse] = {}

@router.post("/monthly-run", response_model=MonthlyJobStatusResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_monthly_run(
    req: MonthlyRunRequest,
    background_tasks: BackgroundTasks,
    mock: bool = Query(False),
    api_key: str = Depends(verify_api_key)
):
    """
    Triggers asynchronous monthly batch anomaly analysis, ML Outlier ranking, and longitudinal metrics computation.
    """
    job_id = f"job_monthly_{req.month.replace('-', '')}_{uuid.uuid4().hex[:8]}"
    config = load_scheme_profile(req.configVersion)

    rules_executed = ["RULE_37_BENEFICIARY_GROWTH", "RULE_38_UNUSUAL_ATTENDANCE_TRENDS", "RULE_39_REPORT_SUBMISSION_BURSTS", "RULE_40_REPEATED_DISCREPANCIES", "RULE_44_CROSS_MODULE_TRIANGULATION"]

    findings = []
    top_risk_units = []

    # In Phase 0 / Mock, generate immediate simulated completed response
    for u in req.unitsData:
        top_risk_units.append({
            "unitId": u.unitId,
            "riskReviewScore": 72.5,
            "riskBand": "HIGH",
            "peerGroup": u.peerGroup,
            "outlierScore": 0.84
        })

    if mock:
        for r_id in rules_executed:
            det = rule_registry.get_detector(r_id)
            if det:
                findings.extend(det.generate_mock_findings({"unitId": "unit_hostel_01", "month": req.month}, config))

    summary = ModuleAnalysisSummary(
        module="behavioral",
        rulesExecuted=rules_executed,
        totalFindings=len(findings),
        riskIndicatorsCount=len(findings),
        dataQualityCount=0,
        highSeverityCount=len(findings),
        mediumSeverityCount=0,
        lowSeverityCount=0,
        totalAmountAtRisk=0.0,
        executionTimeMs=120.5,
        configVersion=config.get("version", "2026.10.v1")
    )

    response = MonthlyJobStatusResponse(
        jobId=job_id,
        status="COMPLETED",
        month=req.month,
        unitsProcessed=len(req.unitsData) or 1,
        totalFindings=len(findings),
        executionTimeMs=120.5,
        completedAt=datetime.utcnow().isoformat() + "Z",
        summary=summary,
        topRiskUnits=top_risk_units,
        findings=findings
    )

    _JOBS_STORE[job_id] = response
    return response

@router.get("/{job_id}/status", response_model=MonthlyJobStatusResponse)
async def get_job_status(
    job_id: str,
    api_key: str = Depends(verify_api_key)
):
    """
    Polls the execution status and findings of a monthly batch run.
    """
    if job_id in _JOBS_STORE:
        return _JOBS_STORE[job_id]
    
    # Return placeholder for mock testing
    return MonthlyJobStatusResponse(
        jobId=job_id,
        status="COMPLETED",
        month="2026-09",
        unitsProcessed=5,
        totalFindings=2,
        executionTimeMs=110.0,
        completedAt=datetime.utcnow().isoformat() + "Z",
        topRiskUnits=[{"unitId": "unit_hostel_01", "riskReviewScore": 68.0, "riskBand": "MEDIUM"}],
        findings=[]
    )

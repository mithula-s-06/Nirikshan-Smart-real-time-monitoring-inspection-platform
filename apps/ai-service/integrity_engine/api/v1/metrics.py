from fastapi import APIRouter, Depends, Query
from src.core.security import verify_api_key
from src.schemas.monthly import UnitRiskProfileResponse
from src.schemas.common import StandardFinding, RuleType, FindingCategory, Severity, SuggestedAction

router = APIRouter(prefix="/units", tags=["Unit Risk Profiles"])

@router.get("/{unit_id}/risk-profile", response_model=UnitRiskProfileResponse)
async def get_unit_risk_profile(
    unit_id: str,
    month: str = Query("2026-09"),
    api_key: str = Depends(verify_api_key)
):
    """
    Retrieves longitudinal risk score, peer group percentiles, and feature breakdown for an institution.
    """
    return UnitRiskProfileResponse(
        unitId=unit_id,
        month=month,
        riskReviewScore=64.5,
        riskBand="MEDIUM",
        compositeRank=8,
        peerGroup="residential_hostel_standard",
        featureContributions={
            "verificationRatioDeficit": 0.35,
            "attendanceVarianceInvariance": 0.25,
            "unresolvedInspectionFindings": 0.20,
            "expenditurePerBeneficiarySpike": 0.20
        },
        findings=[
            StandardFinding(
                module="behavioral",
                ruleId="RULE_40_REPEATED_DISCREPANCIES",
                ruleType=RuleType.STATISTICAL,
                category=FindingCategory.RISK_INDICATOR,
                entityType="unit",
                entityId=unit_id,
                period=month,
                severity=Severity.MEDIUM,
                confidence=0.85,
                reason="Cumulative risk review score is in the 80th percentile for peer group.",
                details={"score": 64.5, "band": "MEDIUM"},
                suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                configVersion="2026.10.v1"
            )
        ]
    )

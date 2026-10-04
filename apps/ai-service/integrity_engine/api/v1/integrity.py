import time
from fastapi import APIRouter, Depends, Query
from src.core.security import verify_api_key
from src.core.scheme_profile import load_scheme_profile
from src.schemas.register import BeneficiaryIntegrityRequest, BeneficiaryIntegrityResponse
from src.schemas.common import ModuleAnalysisSummary, StandardFinding
from src.registry.rule_registry import rule_registry
from src.core.findings_engine import FindingsEngine

router = APIRouter(prefix="/integrity", tags=["Beneficiary Data Integrity"])

@router.post("/beneficiary", response_model=BeneficiaryIntegrityResponse)
async def analyze_beneficiary_integrity(
    req: BeneficiaryIntegrityRequest,
    mock: bool = Query(False),
    api_key: str = Depends(verify_api_key)
):
    """
    Unified Beneficiary Data Integrity endpoint executing Rules 2 through 8.
    Operates selectively on supplied datasets and separates Risk Indicators from Data Quality findings.
    """
    start_time = time.time()
    config = load_scheme_profile(req.configVersion)
    if req.configOverride:
        config.update(req.configOverride)

    rules_executed = []
    raw_findings = []

    # Map request payload
    bens = req.beneficiaries or []
    enrollments = req.enrollments or []
    verifications = req.verifications or []
    claims = req.claims or []
    transfers = req.transfers or []

    # If mock mode is requested or no payload supplied, return mock findings for active rules
    if mock:
        for r_id in ["RULE_2_REPEATED_FAILED_VERIFICATION", "RULE_3_INACTIVE_BENEFICIARY_CLAIM", "RULE_5_SIMILAR_RECORDS", "RULE_6_REPEATED_CONTACT", "RULE_7_INCONSISTENT_DATES", "RULE_8_FREQUENT_TRANSFERS"]:
            detector = rule_registry.get_detector(r_id)
            if detector:
                rules_executed.append(r_id)
                raw_findings.extend(detector.generate_mock_findings({"unitId": "unit_demo_01", "date": "2026-10"}, config))
    else:
        # Check rule 2
        if verifications:
            rules_executed.append("RULE_2_REPEATED_FAILED_VERIFICATION")
            det = rule_registry.get_detector("RULE_2_REPEATED_FAILED_VERIFICATION")
            if det: raw_findings.extend(det.detect({"verifications": verifications}, config))

        # Check rule 3
        if claims and enrollments:
            rules_executed.append("RULE_3_INACTIVE_BENEFICIARY_CLAIM")
            det = rule_registry.get_detector("RULE_3_INACTIVE_BENEFICIARY_CLAIM")
            if det: raw_findings.extend(det.detect({"claims": claims, "enrollments": enrollments}, config))

        # Check rule 4
        if req.beneficiaries and req.baselineDistribution:
            rules_executed.append("RULE_4_UNUSUAL_DISTRIBUTION")
            det = rule_registry.get_detector("RULE_4_UNUSUAL_DISTRIBUTION")
            if det: raw_findings.extend(det.detect({
                "beneficiaries": req.beneficiaries,
                "baselineDistribution": req.baselineDistribution,
                "unitId": req.unitId
            }, config))

        # Check rule 5
        if bens:
            rules_executed.append("RULE_5_SIMILAR_RECORDS")
            det = rule_registry.get_detector("RULE_5_SIMILAR_RECORDS")
            if det: raw_findings.extend(det.detect({"beneficiaries": bens}, config))

        # Check rule 6
        if bens:
            rules_executed.append("RULE_6_REPEATED_CONTACT")
            det = rule_registry.get_detector("RULE_6_REPEATED_CONTACT")
            if det: raw_findings.extend(det.detect({"beneficiaries": bens}, config))

        # Check rule 7
        if bens or enrollments:
            rules_executed.append("RULE_7_INCONSISTENT_DATES")
            det = rule_registry.get_detector("RULE_7_INCONSISTENT_DATES")
            if det: raw_findings.extend(det.detect({"beneficiaries": bens, "enrollments": enrollments}, config))

        # Check rule 8
        if transfers:
            rules_executed.append("RULE_8_FREQUENT_TRANSFERS")
            det = rule_registry.get_detector("RULE_8_FREQUENT_TRANSFERS")
            if det: raw_findings.extend(det.detect({"transfers": transfers}, config))

    # Persist and filter findings
    findings = raw_findings if mock else FindingsEngine.process_and_persist_findings(raw_findings)

    elapsed_ms = (time.time() - start_time) * 1000.0

    risk_count = sum(1 for f in findings if f.category == "risk_indicator")
    dq_count = sum(1 for f in findings if f.category == "data_quality")
    high_count = sum(1 for f in findings if f.severity == "high")
    med_count = sum(1 for f in findings if f.severity == "medium")
    low_count = sum(1 for f in findings if f.severity == "low")
    amt_at_risk = sum(f.amountAtRisk or 0.0 for f in findings)

    summary = ModuleAnalysisSummary(
        module="register",
        rulesExecuted=rules_executed or ["RULE_2_REPEATED_FAILED_VERIFICATION", "RULE_3_INACTIVE_BENEFICIARY_CLAIM", "RULE_5_SIMILAR_RECORDS", "RULE_6_REPEATED_CONTACT", "RULE_7_INCONSISTENT_DATES", "RULE_8_FREQUENT_TRANSFERS"],
        totalFindings=len(findings),
        riskIndicatorsCount=risk_count,
        dataQualityCount=dq_count,
        highSeverityCount=high_count,
        mediumSeverityCount=med_count,
        lowSeverityCount=low_count,
        totalAmountAtRisk=amt_at_risk,
        executionTimeMs=round(elapsed_ms, 2),
        configVersion=config.get("version", "2026.10.v1")
    )

    return BeneficiaryIntegrityResponse(
        summary=summary,
        findings=findings
    )

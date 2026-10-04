import time
from fastapi import APIRouter, Depends, Query
from src.core.security import verify_api_key
from src.core.scheme_profile import load_scheme_profile
from src.schemas.finance import FinanceAnalysisRequest, FinanceAnalysisResponse
from src.schemas.common import ModuleAnalysisSummary
from src.registry.rule_registry import rule_registry
from src.core.findings_engine import FindingsEngine

router = APIRouter(prefix="/finance", tags=["Financial & Expense Analysis"])

@router.post("/analyze", response_model=FinanceAnalysisResponse)
async def analyze_finances(
    req: FinanceAnalysisRequest,
    mock: bool = Query(False),
    api_key: str = Depends(verify_api_key)
):
    """
    Analyzes expenditure claims, line-item arithmetic, duplicate invoices, deadline rush patterns, and burn rate.
    """
    start_time = time.time()
    config = load_scheme_profile(req.configVersion)
    raw_findings = []
    rules_executed = [
        "RULE_16_EXPENDITURE_PER_BENEFICIARY",
        "RULE_17_DUPLICATE_EXPENDITURE_CLAIM",
        "RULE_18_BUDGET_UTILISATION_MISMATCH",
        "RULE_19_SPENDING_NEAR_DEADLINES",
        "RULE_20_EXPENSE_OVER_AUTHORISED_LIMIT",
        "RULE_21_SPENDING_VS_PROJECT_PROGRESS",
        "RULE_22_SIMILAR_INVOICES_ACROSS_UNITS"
    ]

    if mock:
        for r_id in rules_executed:
            det = rule_registry.get_detector(r_id)
            if det:
                raw_findings.extend(det.generate_mock_findings({"unitId": req.unitId, "date": req.financialYear}, config))
    else:
        payload = {
            "unitId": req.unitId,
            "period": req.financialYear,
            "verifiedBeneficiaries": req.verifiedBeneficiariesCount,
            "monthlyExpenditure": req.monthlyExpenditure or sum(inv.amount for inv in req.invoices),
            "peerGroupCosts": req.peerGroupCosts,
            "budgetHeads": [h.model_dump() for h in req.budgetHeads],
            "openingBalance": req.openingBalance,
            "disbursals": req.disbursals,
            "totalExpenditure": req.totalExpenditure or sum(inv.amount for inv in req.invoices),
            "closingBalance": req.closingBalance,
            "fiscalYearDeadline": req.fiscalYearDeadline,
            "fundDisbursalDate": req.fundDisbursalDate,
            "totalSanctionedGrant": req.totalSanctionedGrant,
            "totalDisbursedFunds": req.totalDisbursedFunds,
            "verifiedPhysicalProgressPercent": req.verifiedPhysicalProgressPercent,
            "crossUnitInvoices": req.crossUnitInvoices,
            "invoices": [inv.model_dump() for inv in req.invoices]
        }

        # Rule 16: Cost per attendee MAD
        det16 = rule_registry.get_detector("RULE_16_EXPENDITURE_PER_BENEFICIARY")
        if det16: raw_findings.extend(det16.detect(payload, config))

        # Rule 17: Duplicate claims & GSTIN check
        det17 = rule_registry.get_detector("RULE_17_DUPLICATE_EXPENDITURE_CLAIM")
        if det17: raw_findings.extend(det17.detect(payload, config))

        # Rule 18: Budget arithmetic & head ceilings
        det18 = rule_registry.get_detector("RULE_18_BUDGET_UTILISATION_MISMATCH")
        if det18: raw_findings.extend(det18.detect(payload, config))

        # Rule 19: Spending near deadlines
        det19 = rule_registry.get_detector("RULE_19_SPENDING_NEAR_DEADLINES")
        if det19: raw_findings.extend(det19.detect(payload, config))

        # Rule 20: Limit breach & splitting
        det20 = rule_registry.get_detector("RULE_20_EXPENSE_OVER_AUTHORISED_LIMIT")
        if det20: raw_findings.extend(det20.detect(payload, config))

        # Rule 21: Spending vs progress
        det21 = rule_registry.get_detector("RULE_21_SPENDING_VS_PROJECT_PROGRESS")
        if det21: raw_findings.extend(det21.detect(payload, config))

        # Rule 22: Cross-unit similar invoices
        det22 = rule_registry.get_detector("RULE_22_SIMILAR_INVOICES_ACROSS_UNITS")
        if det22: raw_findings.extend(det22.detect(payload, config))

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
        module="finance",
        rulesExecuted=rules_executed,
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

    return FinanceAnalysisResponse(
        summary=summary,
        findings=findings
    )

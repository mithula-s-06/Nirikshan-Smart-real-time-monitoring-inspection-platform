import time
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from src.core.security import verify_api_key
from src.core.scheme_profile import load_scheme_profile
from src.schemas.inspection import (
    InspectionAnalysisRequest,
    InspectionAnalysisResponse,
    InspectionAnalysisMetrics
)
from src.schemas.common import ModuleAnalysisSummary
from src.registry.rule_registry import rule_registry
from src.core.findings_engine import FindingsEngine

router = APIRouter(prefix="/inspection", tags=["Inspection Audit Analysis"])

@router.post("/analyze", response_model=InspectionAnalysisResponse)
async def analyze_inspection(
    req: InspectionAnalysisRequest,
    mock: bool = Query(False),
    api_key: str = Depends(verify_api_key)
):
    """
    Evaluates inspection visit telemetry, duration feasibility, checklist completeness, evidence integrity,
    repeated unresolved findings, post-submission modifications, schedule feasibility, and leniency bias.
    """
    start_time = time.time()
    config = load_scheme_profile(req.configVersion)
    
    total_items = req.scheduledChecklistCount or 25
    answered = len(req.checklistResponses)
    na_count = sum(1 for item in req.checklistResponses if item.isNA)
    completeness = answered / total_items if total_items > 0 else 1.0

    # Calculate duration
    duration = req.durationMinutes or 35.0
    if req.visitStartTime and req.visitEndTime:
        try:
            st = datetime.fromisoformat(req.visitStartTime.replace("Z", "+00:00")).timestamp()
            et = datetime.fromisoformat(req.visitEndTime.replace("Z", "+00:00")).timestamp()
            duration = max(1.0, round((et - st) / 60.0, 1))
        except Exception:
            pass

    metrics = InspectionAnalysisMetrics(
        completenessScore=round(completeness, 2),
        durationMinutes=duration,
        geofenceAdherence=True,
        evidenceIntegrityScore=1.0,
        naRatio=round(na_count / max(1, answered), 2)
    )

    raw_findings = []
    rules_executed = [
        "RULE_23_LOCATION_MISMATCH",
        "RULE_24_REPEATEDLY_INCOMPLETE_INSPECTIONS",
        "RULE_25_UNUSUALLY_SHORT_INSPECTIONS",
        "RULE_26_EVIDENCE_OUTSIDE_VISIT",
        "RULE_27_REPEATED_FINDINGS_UNRESOLVED",
        "RULE_28_SUSPICIOUS_POST_SUBMISSION_EDITS",
        "RULE_29_ASSIGNMENT_CONFLICTS",
        "RULE_30_POSSIBLE_COLLUSION_INDICATORS"
    ]

    if mock:
        for r_id in rules_executed:
            det = rule_registry.get_detector(r_id)
            if det:
                raw_findings.extend(det.generate_mock_findings({"unitId": req.unitId, "visitDate": req.visitDate}, config))
    else:
        # Prepare telemetry dict
        gps_dict = None
        if isinstance(req.gpsTelemetry, dict):
            gps_dict = req.gpsTelemetry
        elif isinstance(req.gpsTelemetry, list) and req.gpsTelemetry:
            first_gps = req.gpsTelemetry[0]
            gps_dict = first_gps.model_dump() if hasattr(first_gps, "model_dump") else first_gps

        photos = req.evidencePhotos or req.photoEvidence or []

        payload = {
            "inspectionId": req.inspectionId,
            "unitId": req.unitId,
            "inspectorId": req.inspectorId,
            "visitDate": req.visitDate,
            "visitStartTime": req.visitStartTime,
            "visitEndTime": req.visitEndTime,
            "durationMinutes": duration,
            "activeBeneficiariesCount": 20,
            "gpsTelemetry": gps_dict,
            "unitLocation": req.unitLocation,
            "inspectionResponses": [r.model_dump() for r in req.checklistResponses],
            "evidencePhotos": [p.model_dump() for p in photos],
            "currentDeficiencies": req.currentDeficiencies,
            "historicalDeficiencies": req.historicalDeficiencies,
            "modificationAuditLog": req.modificationAuditLog,
            "inspectorScheduleVisits": req.inspectorScheduleVisits,
            "inspectorPairingHistory": req.inspectorPairingHistory,
            "inspectorCommentsHistory": req.inspectorCommentsHistory
        }

        # Rule 23: Location mismatch & mock GPS
        det23 = rule_registry.get_detector("RULE_23_LOCATION_MISMATCH")
        if det23: raw_findings.extend(det23.detect(payload, config))

        # Rule 24: Incomplete checklist
        det24 = rule_registry.get_detector("RULE_24_REPEATEDLY_INCOMPLETE_INSPECTIONS")
        if det24: raw_findings.extend(det24.detect(payload, config))

        # Rule 25: Unusually short visit
        det25 = rule_registry.get_detector("RULE_25_UNUSUALLY_SHORT_INSPECTIONS")
        if det25: raw_findings.extend(det25.detect(payload, config))

        # Rule 26: Evidence outside window
        det26 = rule_registry.get_detector("RULE_26_EVIDENCE_OUTSIDE_VISIT")
        if det26: raw_findings.extend(det26.detect(payload, config))

        # Rule 27: Unresolved recurring findings
        det27 = rule_registry.get_detector("RULE_27_REPEATED_FINDINGS_UNRESOLVED")
        if det27: raw_findings.extend(det27.detect(payload, config))

        # Rule 28: Post-submission edits
        det28 = rule_registry.get_detector("RULE_28_SUSPICIOUS_POST_SUBMISSION_EDITS")
        if det28: raw_findings.extend(det28.detect(payload, config))

        # Rule 29: Assignment conflicts & impossible travel
        det29 = rule_registry.get_detector("RULE_29_ASSIGNMENT_CONFLICTS")
        if det29: raw_findings.extend(det29.detect(payload, config))

        # Rule 30: Possible collusion & leniency
        det30 = rule_registry.get_detector("RULE_30_POSSIBLE_COLLUSION_INDICATORS")
        if det30: raw_findings.extend(det30.detect(payload, config))

    # Persist and filter findings
    findings = raw_findings if mock else FindingsEngine.process_and_persist_findings(raw_findings)

    elapsed_ms = (time.time() - start_time) * 1000.0

    risk_count = sum(1 for f in findings if f.category == "risk_indicator")
    dq_count = sum(1 for f in findings if f.category == "data_quality")
    high_count = sum(1 for f in findings if f.severity == "high")
    med_count = sum(1 for f in findings if f.severity == "medium")
    low_count = sum(1 for f in findings if f.severity == "low")

    summary = ModuleAnalysisSummary(
        module="inspection",
        rulesExecuted=rules_executed,
        totalFindings=len(findings),
        riskIndicatorsCount=risk_count,
        dataQualityCount=dq_count,
        highSeverityCount=high_count,
        mediumSeverityCount=med_count,
        lowSeverityCount=low_count,
        totalAmountAtRisk=0.0,
        executionTimeMs=round(elapsed_ms, 2),
        configVersion=config.get("version", "2026.10.v1")
    )

    return InspectionAnalysisResponse(
        inspectionId=req.inspectionId,
        metrics=metrics,
        summary=summary,
        findings=findings
    )

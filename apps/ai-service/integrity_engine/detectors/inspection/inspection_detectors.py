"""
Pure Inspection Anomaly Detectors for DoSJE.
Implements:
- RULE_23_LOCATION_MISMATCH: Off-site GPS breach, mock location, or copy-pasted coordinates.
- RULE_24_REPEATEDLY_INCOMPLETE_INSPECTIONS: High N/A rate, missing mandatory sections, filler text.
- RULE_25_UNUSUALLY_SHORT_INSPECTIONS: Visit completed too quickly vs baseline, rapid bulk answering.
- RULE_26_EVIDENCE_OUTSIDE_VISIT: Evidence timestamp out of sync, photo reuse across inspections.
- RULE_27_REPEATED_FINDINGS_UNRESOLVED: Chronic non-compliance & unrectified deficiencies across visits.
- RULE_28_SUSPICIOUS_POST_SUBMISSION_EDITS: Material retroactive modifications to finalized inspection reports.
- RULE_29_ASSIGNMENT_CONFLICTS: Overlapping visits and impossible travel velocity between units.
- RULE_30_POSSIBLE_COLLUSION_INDICATORS: Inspector leniency bias, copy-paste comment invariance.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from src.registry.base import BaseDetector
from src.schemas.common import StandardFinding, RuleType, FindingCategory, Severity, SuggestedAction
from src.detectors.common import check_geofence_breach, hamming_distance, haversine_distance_meters, compute_name_similarity

class Rule23LocationMismatchDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        gps_telemetry = payload.get("gpsTelemetry")
        unit_loc = payload.get("unitLocation")
        inspection_id = payload.get("inspectionId", "insp_unknown")
        unit_id = payload.get("unitId", "unit_unknown")
        inspector_id = payload.get("inspectorId", "insp_user")
        period = payload.get("visitDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        config_version = config.get("version", "2026.10.v1")

        if not gps_telemetry or not unit_loc:
            return []

        # Check mock location flag
        if gps_telemetry.get("isMockLocation") is True or gps_telemetry.get("isMock") is True:
            findings.append(StandardFinding(
                module="inspection",
                ruleId="RULE_23_LOCATION_MISMATCH",
                ruleType=RuleType.RULE_BASED,
                category=FindingCategory.RISK_INDICATOR,
                entityType="inspection",
                entityId=inspection_id,
                period=period,
                severity=Severity.HIGH,
                confidence=0.99,
                reason="Inspection telemetry flagged with active Mock-Location (simulated GPS coordinates).",
                details={
                    "isMockLocation": True,
                    "inspectorId": inspector_id,
                    "unitId": unit_id
                },
                evidenceRefs=[inspection_id],
                suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                configVersion=config_version
            ))
            return findings

        # Check geofence breach
        insp_lat = gps_telemetry.get("latitude") or gps_telemetry.get("lat")
        insp_lon = gps_telemetry.get("longitude") or gps_telemetry.get("lng")
        unit_lat = unit_loc.get("latitude") or unit_loc.get("lat")
        unit_lon = unit_loc.get("longitude") or unit_loc.get("lng")

        if insp_lat is not None and insp_lon is not None and unit_lat is not None and unit_lon is not None:
            max_dist = config.get("inspection", {}).get("maxGpsDistanceMeters", 250.0)
            accuracy = float(gps_telemetry.get("accuracyMeters") or gps_telemetry.get("accuracy", 15.0))
            
            # Legitimate exception check: multi-campus or satellite site
            is_satellite = payload.get("isSatelliteSiteAuthorized", False)
            if not is_satellite:
                breached, raw_dist, eff_dist = check_geofence_breach(
                    float(insp_lat), float(insp_lon), float(unit_lat), float(unit_lon), max_dist, accuracy
                )
                if breached:
                    findings.append(StandardFinding(
                        module="inspection",
                        ruleId="RULE_23_LOCATION_MISMATCH",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="inspection",
                        entityId=inspection_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.95,
                        reason=f"Inspection GPS fix recorded {round(raw_dist, 1)}m away from registered unit location, exceeding allowed {max_dist}m limit.",
                        details={
                            "rawDistanceMeters": round(raw_dist, 1),
                            "effectiveDistanceMeters": round(eff_dist, 1),
                            "maxAllowedMeters": max_dist,
                            "gpsAccuracy": accuracy,
                            "inspectorId": inspector_id
                        },
                        evidenceRefs=[inspection_id],
                        suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                        configVersion=config_version
                    ))

        # Check repeated identical coordinates across different visits
        past_inspections = payload.get("pastInspectionsTelemetry") or []
        for past in past_inspections:
            p_lat = past.get("latitude") or past.get("lat")
            p_lon = past.get("longitude") or past.get("lng")
            if p_lat is not None and p_lon is not None and insp_lat is not None and insp_lon is not None:
                # 6 decimal places match exactly
                if round(float(p_lat), 6) == round(float(insp_lat), 6) and round(float(p_lon), 6) == round(float(insp_lon), 6):
                    findings.append(StandardFinding(
                        module="inspection",
                        ruleId="RULE_23_LOCATION_MISMATCH",
                        ruleType=RuleType.STATISTICAL,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="inspection",
                        entityId=inspection_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.90,
                        reason=f"Identical GPS coordinates repeated exactly across separate inspections ({past.get('inspectionId')}).",
                        details={
                            "matchedInspectionId": past.get("inspectionId"),
                            "coordinates": [float(insp_lat), float(insp_lon)]
                        },
                        evidenceRefs=[inspection_id, past.get("inspectionId", "past_insp")],
                        suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                        configVersion=config_version
                    ))
                    break

        return findings


class Rule24RepeatedlyIncompleteInspectionsDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        inspection_id = payload.get("inspectionId", "insp_unknown")
        period = payload.get("visitDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        config_version = config.get("version", "2026.10.v1")
        responses = payload.get("inspectionResponses") or payload.get("checklistResponses") or []

        if not responses:
            return []

        # Legitimate exception: unit renovation or temporary closure
        if payload.get("isFacilityRenovation") is True:
            return []

        max_na_pct = config.get("inspection", {}).get("maxNaPercentage", 0.25)
        total_items = len(responses)
        na_count = 0
        filler_count = 0
        blank_mandatory = 0

        filler_terms = {"na", "n/a", "ok", "good", ".", "-", "none", "nil", "test"}

        for resp in responses:
            val = str(resp.get("value") or resp.get("response") or "").strip().lower()
            is_na = resp.get("isNA", False)
            is_mandatory = resp.get("isMandatory", False)
            
            if is_na or val in ("na", "n/a", "not_applicable"):
                na_count += 1
            elif val in filler_terms:
                filler_count += 1
            elif not val and is_mandatory:
                blank_mandatory += 1

        na_ratio = na_count / total_items if total_items > 0 else 0.0
        filler_ratio = (na_count + filler_count) / total_items if total_items > 0 else 0.0

        if na_ratio > max_na_pct or blank_mandatory > 0 or filler_ratio > 0.40:
            severity = Severity.HIGH if (blank_mandatory > 2 or na_ratio > 0.50) else Severity.MEDIUM
            findings.append(StandardFinding(
                module="inspection",
                ruleId="RULE_24_REPEATEDLY_INCOMPLETE_INSPECTIONS",
                ruleType=RuleType.STATISTICAL,
                category=FindingCategory.RISK_INDICATOR,
                entityType="inspection",
                entityId=inspection_id,
                period=period,
                severity=severity,
                confidence=0.89,
                reason=f"Checklist completeness is compromised with {round(na_ratio * 100, 1)}% N/A answers and {blank_mandatory} blank mandatory items.",
                details={
                    "totalItems": total_items,
                    "naCount": na_count,
                    "naRatio": round(na_ratio, 3),
                    "fillerCount": filler_count,
                    "blankMandatoryCount": blank_mandatory,
                    "maxAllowedNaRatio": max_na_pct
                },
                evidenceRefs=[inspection_id],
                suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                configVersion=config_version
            ))

        return findings


class Rule25UnusuallyShortInspectionsDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        inspection_id = payload.get("inspectionId", "insp_unknown")
        period = payload.get("visitDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        config_version = config.get("version", "2026.10.v1")

        duration_minutes = payload.get("durationMinutes")
        beneficiary_count = payload.get("activeBeneficiariesCount", 20)
        responses = payload.get("inspectionResponses") or payload.get("checklistResponses") or []

        if duration_minutes is None:
            return []

        # Legitimate exception: targeted micro-follow-up visit
        if payload.get("isFollowUpMicroVisit") is True:
            return []

        min_base = config.get("inspection", {}).get("minDurationMinutesPer20Beneficiaries", 20)
        expected_duration = (beneficiary_count / 20.0) * min_base * 0.5
        
        # Check overall duration
        if duration_minutes < expected_duration and duration_minutes < 10.0:
            findings.append(StandardFinding(
                module="inspection",
                ruleId="RULE_25_UNUSUALLY_SHORT_INSPECTIONS",
                ruleType=RuleType.STATISTICAL,
                category=FindingCategory.RISK_INDICATOR,
                entityType="inspection",
                entityId=inspection_id,
                period=period,
                severity=Severity.MEDIUM,
                confidence=0.88,
                reason=f"Inspection completed in {duration_minutes} minutes, significantly shorter than the expected baseline of {round(expected_duration, 1)} minutes.",
                details={
                    "actualDurationMinutes": duration_minutes,
                    "expectedMinimumMinutes": round(expected_duration, 1),
                    "beneficiaryCount": beneficiary_count,
                    "checklistCount": len(responses)
                },
                evidenceRefs=[inspection_id],
                suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                configVersion=config_version
            ))

        # Check question answer velocity (bulk speed answering)
        if responses and duration_minutes > 0:
            seconds_per_question = (duration_minutes * 60.0) / len(responses)
            if seconds_per_question < 4.0 and len(responses) >= 15:
                findings.append(StandardFinding(
                    module="inspection",
                    ruleId="RULE_25_UNUSUALLY_SHORT_INSPECTIONS",
                    ruleType=RuleType.STATISTICAL,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="inspection",
                    entityId=inspection_id,
                    period=period,
                    severity=Severity.HIGH,
                    confidence=0.92,
                    reason=f"Checklist responses recorded at an improbable rate of {round(seconds_per_question, 1)} seconds per question.",
                    details={
                        "totalQuestions": len(responses),
                        "durationMinutes": duration_minutes,
                        "secondsPerQuestion": round(seconds_per_question, 1)
                    },
                    evidenceRefs=[inspection_id],
                    suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                    configVersion=config_version
                ))

        return findings


class Rule26EvidenceOutsideVisitDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        inspection_id = payload.get("inspectionId", "insp_unknown")
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("visitDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        config_version = config.get("version", "2026.10.v1")

        start_time_str = payload.get("visitStartTime")
        end_time_str = payload.get("visitEndTime")
        photos = payload.get("evidencePhotos") or payload.get("photoEvidence") or []
        historical_photos = payload.get("historicalEvidencePhotos") or []

        if not photos:
            return []

        # Parse visit start and end
        start_ts = None
        end_ts = None
        try:
            if start_time_str:
                start_ts = datetime.fromisoformat(start_time_str.replace("Z", "+00:00")).timestamp()
            if end_time_str:
                end_ts = datetime.fromisoformat(end_time_str.replace("Z", "+00:00")).timestamp()
        except Exception:
            pass

        max_drift = config.get("inspection", {}).get("photoClockOffsetToleranceSeconds", 300)

        for photo in photos:
            cap_time_str = photo.get("capturedAt") or photo.get("captureTime")
            p_sha = photo.get("sha256")
            p_hash = photo.get("pHash")

            # 1. Check time out of bounds
            if cap_time_str and start_ts and end_ts:
                try:
                    cap_ts = datetime.fromisoformat(cap_time_str.replace("Z", "+00:00")).timestamp()
                    if cap_ts < (start_ts - max_drift) or cap_ts > (end_ts + max_drift):
                        time_diff_min = round(abs(cap_ts - (start_ts if cap_ts < start_ts else end_ts)) / 60.0, 1)
                        is_offline_sync = payload.get("offlineSync", False)
                        if not is_offline_sync or time_diff_min > 120:
                            findings.append(StandardFinding(
                                module="inspection",
                                ruleId="RULE_26_EVIDENCE_OUTSIDE_VISIT",
                                ruleType=RuleType.RULE_BASED,
                                category=FindingCategory.RISK_INDICATOR,
                                entityType="inspection",
                                entityId=inspection_id,
                                period=period,
                                severity=Severity.HIGH,
                                confidence=0.94,
                                reason=f"Evidence photo timestamp falls outside the recorded inspection visit window by {time_diff_min} minutes.",
                                details={
                                    "photoCapturedAt": cap_time_str,
                                    "visitWindow": [start_time_str, end_time_str],
                                    "driftMinutes": time_diff_min
                                },
                                evidenceRefs=[p_sha[:12] if p_sha else "photo_ref"],
                                suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                                configVersion=config_version
                            ))
                except Exception:
                    pass

            # 2. Check photo reuse against historical inspection photos
            for hp in historical_photos:
                h_sha = hp.get("sha256")
                h_hash = hp.get("pHash")
                is_match = False
                if p_sha and h_sha and p_sha == h_sha:
                    is_match = True
                elif p_hash and h_hash and hamming_distance(p_hash, h_hash) <= 3:
                    is_match = True

                if is_match:
                    findings.append(StandardFinding(
                        module="inspection",
                        ruleId="RULE_26_EVIDENCE_OUTSIDE_VISIT",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="inspection",
                        entityId=inspection_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.98,
                        reason=f"Inspection photo matches an image previously submitted for inspection {hp.get('inspectionId')}.",
                        details={
                            "matchedInspectionId": hp.get("inspectionId"),
                            "matchedUnitId": hp.get("unitId"),
                            "sha256": p_sha
                        },
                        evidenceRefs=[p_sha[:12] if p_sha else "photo_ref"],
                        suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                        configVersion=config_version
                    ))
                    break

        return findings


class Rule27RepeatedFindingsUnresolvedDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        unit_id = payload.get("unitId", "unit_unknown")
        inspection_id = payload.get("inspectionId", "insp_unknown")
        period = payload.get("visitDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        config_version = config.get("version", "2026.10.v1")

        current_deficiencies = payload.get("currentDeficiencies") or []
        past_deficiencies = payload.get("historicalDeficiencies") or []

        if not current_deficiencies or not past_deficiencies:
            return []

        # Legitimate exception check: Approved remediation plan with formal deadline extension
        if payload.get("hasApprovedRectificationPlan") is True:
            return []

        # Match recurring deficiency codes / categories
        past_codes = set()
        for p_def in past_deficiencies:
            code = p_def.get("deficiencyCode") or p_def.get("category")
            if code:
                past_codes.add(str(code).upper())

        for curr in current_deficiencies:
            c_code = str(curr.get("deficiencyCode") or curr.get("category") or "").upper()
            c_desc = curr.get("description", c_code)
            
            if c_code and c_code in past_codes:
                consecutive_count = int(curr.get("consecutiveOccurrences", 2))
                sev = Severity.HIGH if consecutive_count >= 3 else Severity.MEDIUM
                findings.append(StandardFinding(
                    module="inspection",
                    ruleId="RULE_27_REPEATED_FINDINGS_UNRESOLVED",
                    ruleType=RuleType.RULE_BASED,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="unit",
                    entityId=unit_id,
                    period=period,
                    severity=sev,
                    confidence=0.96,
                    reason=f"Critical inspection deficiency '{c_desc}' remains unresolved across {consecutive_count} consecutive inspection cycles.",
                    details={
                        "deficiencyCode": c_code,
                        "description": c_desc,
                        "consecutiveCycles": consecutive_count,
                        "inspectionId": inspection_id
                    },
                    evidenceRefs=[inspection_id, c_code],
                    suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                    configVersion=config_version
                ))

        return findings


class Rule28SuspiciousPostSubmissionEditsDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        inspection_id = payload.get("inspectionId", "insp_unknown")
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("visitDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        config_version = config.get("version", "2026.10.v1")

        audit_log = payload.get("modificationAuditLog") or []
        if not audit_log:
            return []

        # Legitimate exception: Formal supervisor-approved clerical correction
        if payload.get("hasSupervisorApproval") is True:
            return []

        for log_entry in audit_log:
            field_name = log_entry.get("fieldModified", "")
            old_val = str(log_entry.get("oldValue", ""))
            new_val = str(log_entry.get("newValue", ""))
            mins_after = float(log_entry.get("minutesAfterFinalSubmission", 0.0))

            # Material fields: changing ratings from Deficient to Satisfactory, reducing cited violations, etc.
            is_material = (
                ("rating" in field_name.lower() or "score" in field_name.lower() or "headcount" in field_name.lower() or "response" in field_name.lower()) and
                (old_val.lower() in ("deficient", "unsatisfactory", "non_compliant") and new_val.lower() in ("satisfactory", "compliant", "ok"))
            ) or (mins_after > 120.0 and field_name)

            if is_material:
                findings.append(StandardFinding(
                    module="inspection",
                    ruleId="RULE_28_SUSPICIOUS_POST_SUBMISSION_EDITS",
                    ruleType=RuleType.RULE_BASED,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="inspection",
                    entityId=inspection_id,
                    period=period,
                    severity=Severity.HIGH,
                    confidence=0.95,
                    reason=f"Material retrospective modification made to '{field_name}' ({old_val} -> {new_val}) {int(mins_after)} minutes after finalized submission without supervisor sign-off.",
                    details={
                        "fieldModified": field_name,
                        "oldValue": old_val,
                        "newValue": new_val,
                        "minutesAfterSubmission": mins_after,
                        "editorId": log_entry.get("editorId")
                    },
                    evidenceRefs=[inspection_id, f"audit_log_{field_name}"],
                    suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                    configVersion=config_version
                ))

        return findings


class Rule29AssignmentConflictsDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        inspector_id = payload.get("inspectorId", "insp_user")
        period = payload.get("visitDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        config_version = config.get("version", "2026.10.v1")

        visits = payload.get("inspectorScheduleVisits") or []
        if len(visits) < 2:
            return []

        visits.sort(key=lambda x: str(x.get("startTime", "")))

        for i in range(len(visits) - 1):
            v1 = visits[i]
            v2 = visits[i + 1]

            s1_str, e1_str = v1.get("startTime"), v1.get("endTime")
            s2_str, e2_str = v2.get("startTime"), v2.get("endTime")
            loc1, loc2 = v1.get("location"), v2.get("location")

            if not (s1_str and e1_str and s2_str and loc1 and loc2):
                continue

            try:
                t_e1 = datetime.fromisoformat(e1_str.replace("Z", "+00:00")).timestamp()
                t_s2 = datetime.fromisoformat(s2_str.replace("Z", "+00:00")).timestamp()
                
                # Check 1: Direct overlap
                if t_s2 < t_e1:
                    findings.append(StandardFinding(
                        module="inspection",
                        ruleId="RULE_29_ASSIGNMENT_CONFLICTS",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="inspector",
                        entityId=inspector_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.99,
                        reason=f"Simultaneous overlapping inspections logged for units {v1.get('unitId')} and {v2.get('unitId')}.",
                        details={"unit1": v1.get("unitId"), "unit2": v2.get("unitId"), "time1": [s1_str, e1_str], "time2": [s2_str, e2_str]},
                        evidenceRefs=[v1.get("inspectionId", "v1"), v2.get("inspectionId", "v2")],
                        suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                        configVersion=config_version
                    ))
                    continue

                # Check 2: Impossible travel velocity
                gap_hours = max(0.01, (t_s2 - t_e1) / 3600.0)
                dist_m = haversine_distance_meters(
                    float(loc1["latitude"]), float(loc1["longitude"]),
                    float(loc2["latitude"]), float(loc2["longitude"])
                )
                dist_km = dist_m / 1000.0
                req_speed_kmh = dist_km / gap_hours

                # If required speed > 85 km/h across units in different towns
                if dist_km > 30.0 and req_speed_kmh > 85.0:
                    findings.append(StandardFinding(
                        module="inspection",
                        ruleId="RULE_29_ASSIGNMENT_CONFLICTS",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="inspector",
                        entityId=inspector_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.96,
                        reason=f"Geographically impossible inspection schedule: {round(dist_km, 1)} km between units with only {int(gap_hours * 60)} min travel time (required speed: {round(req_speed_kmh, 1)} km/h).",
                        details={
                            "distanceKm": round(dist_km, 1),
                            "travelGapMinutes": round(gap_hours * 60, 1),
                            "requiredSpeedKmh": round(req_speed_kmh, 1),
                            "unit1": v1.get("unitId"),
                            "unit2": v2.get("unitId")
                        },
                        evidenceRefs=[v1.get("inspectionId", "v1"), v2.get("inspectionId", "v2")],
                        suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                        configVersion=config_version
                    ))
            except Exception:
                continue

        return findings


class Rule30PossibleCollusionIndicatorsDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        inspector_id = payload.get("inspectorId", "insp_user")
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("visitDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        config_version = config.get("version", "2026.10.v1")

        pairing_history = payload.get("inspectorPairingHistory") or []
        comment_samples = payload.get("inspectorCommentsHistory") or []

        # Check 1: Leniency bias on repeat pairing (inspector always gives 100% clean reports to a specific unit)
        if len(pairing_history) >= 3:
            unit_pairings = [p for p in pairing_history if p.get("unitId") == unit_id]
            other_inspectors_to_unit = payload.get("thirdPartyAuditsToUnit") or []

            clean_count = sum(1 for p in unit_pairings if p.get("deficiencyCount", 0) == 0 and p.get("score", 100) >= 98)
            
            # If inspector gave 3+ clean reports, but independent unannounced audits found multiple deficiencies
            if clean_count >= 3 and len(other_inspectors_to_unit) >= 1:
                third_party_deficiencies = sum(t.get("deficiencyCount", 0) for t in other_inspectors_to_unit)
                if third_party_deficiencies >= 2:
                    findings.append(StandardFinding(
                        module="inspection",
                        ruleId="RULE_30_POSSIBLE_COLLUSION_INDICATORS",
                        ruleType=RuleType.STATISTICAL,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="inspector",
                        entityId=inspector_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.92,
                        reason=f"Significant repeat-pairing leniency: Inspector recorded 0 deficiencies across {clean_count} visits, conflicting with independent audit findings ({third_party_deficiencies} deficiencies).",
                        details={
                            "cleanVisitsByInspector": clean_count,
                            "independentAuditDeficiencies": third_party_deficiencies,
                            "unitId": unit_id
                        },
                        evidenceRefs=[unit_id, inspector_id],
                        suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                        configVersion=config_version
                    ))

        # Check 2: Exact copy-paste text comment invariance across multiple distinct units
        if len(comment_samples) >= 4:
            c_texts = [str(c.get("text", "")).strip() for c in comment_samples if len(str(c.get("text", "")).strip()) > 30]
            if len(c_texts) >= 4:
                # Compare pairwise similarity
                identical_pairs = 0
                for i in range(len(c_texts)):
                    for j in range(i + 1, len(c_texts)):
                        sim = compute_name_similarity(c_texts[i], c_texts[j])
                        if sim >= 0.95:
                            identical_pairs += 1

                if identical_pairs >= 3:
                    findings.append(StandardFinding(
                        module="inspection",
                        ruleId="RULE_30_POSSIBLE_COLLUSION_INDICATORS",
                        ruleType=RuleType.STATISTICAL,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="inspector",
                        entityId=inspector_id,
                        period=period,
                        severity=Severity.MEDIUM,
                        confidence=0.88,
                        reason=f"Inspection narrative text exhibits zero variation across {len(c_texts)} distinct institutional visits (copypasta comments).",
                        details={"commentSamplesCount": len(c_texts), "identicalPairings": identical_pairs},
                        evidenceRefs=[inspector_id],
                        suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                        configVersion=config_version
                    ))

        return findings

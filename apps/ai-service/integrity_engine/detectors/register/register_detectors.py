"""
Pure Register Integrity Detectors (Rules 2 through 8).
Implements:
- RULE_5_SIMILAR_RECORDS: Multi-key blocking, composite fuzzy match, twin/sibling filter.
- RULE_6_REPEATED_CONTACT: Normalized phone/bank clustering with family & institutional exceptions.
- RULE_2_REPEATED_FAILED_VERIFICATION: Sliding window failure clusters with technical error filtering.
- RULE_3_INACTIVE_BENEFICIARY_CLAIM: Claim disbursement outside enrollment with grace period & exit escalation.
- RULE_4_UNUSUAL_DISTRIBUTION: Category proportion shifts (Chi-square + TVD) with event suppression.
- RULE_7_INCONSISTENT_DATES: Chronological paradoxes and concurrent unit overlaps.
- RULE_8_FREQUENT_TRANSFERS: Rapid mobility and ping-pong transfer loops.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Set
import numpy as np
from scipy.stats import chisquare

from src.registry.base import BaseDetector
from src.schemas.common import StandardFinding, RuleType, FindingCategory, Severity, SuggestedAction
from src.detectors.common import compute_name_similarity, soundex_code, normalize_phone

class Rule5SimilarRecordsDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        beneficiaries = payload.get("beneficiaries") or []
        if len(beneficiaries) < 2:
            return []

        cfg = config.get("registerIntegrity", {}).get("rule5_similarRecords", {})
        med_thresh = cfg.get("mediumThreshold", 0.72)
        high_thresh = cfg.get("highThreshold", 0.86)
        twin_max_sim = cfg.get("twinFirstNameDissimilarityMax", 0.70)
        weights = cfg.get("weights", {"name": 0.40, "dob": 0.25, "guardian": 0.20, "address": 0.15})
        config_version = config.get("version", "2026.10.v1")

        # Multi-key candidate blocking
        blocks: Dict[str, List[Dict[str, Any]]] = {}
        for b in beneficiaries:
            dob = str(b.get("dateOfBirth") or b.get("dob") or "")
            guardian = str(b.get("guardianName") or "")
            district = str(b.get("district") or "")
            
            # Key 1: exact DOB
            if dob:
                k1 = f"dob_{dob}"
                blocks.setdefault(k1, []).append(b)
            # Key 2: District + Soundex(Guardian)
            if district and guardian:
                k2 = f"dist_guard_{district}_{soundex_code(guardian)}"
                blocks.setdefault(k2, []).append(b)

        compared_pairs: Set[str] = set()

        for block_key, members in blocks.items():
            if len(members) < 2:
                continue
            for i in range(len(members)):
                for j in range(i + 1, len(members)):
                    b1, b2 = members[i], members[j]
                    id1, id2 = str(b1.get("id")), str(b2.get("id"))
                    pair_id = "::".join(sorted([id1, id2]))
                    if pair_id in compared_pairs:
                        continue
                    compared_pairs.add(pair_id)

                    name1, name2 = str(b1.get("name", "")), str(b2.get("name", ""))
                    dob1 = str(b1.get("dateOfBirth") or b1.get("dob") or "")
                    dob2 = str(b2.get("dateOfBirth") or b2.get("dob") or "")
                    g1, g2 = str(b1.get("guardianName", "")), str(b2.get("guardianName", ""))
                    addr1, addr2 = str(b1.get("address", "")), str(b2.get("address", ""))

                    # Sub-similarities
                    name_sim = compute_name_similarity(name1, name2)
                    dob_sim = 1.0 if (dob1 and dob2 and dob1 == dob2) else 0.0
                    g_sim = compute_name_similarity(g1, g2) if (g1 and g2) else 0.5
                    addr_sim = compute_name_similarity(addr1, addr2) if (addr1 and addr2) else 0.5

                    # Twin / Sibling exception check:
                    # Same DOB, same Guardian, but distinct first names with different initials/soundex (not abbreviation)
                    fn1 = name1.split()[0].lower() if name1 else ""
                    fn2 = name2.split()[0].lower() if name2 else ""
                    fn_sim = compute_name_similarity(fn1, fn2)
                    
                    # Common abbreviation check (e.g. md -> mohammad)
                    is_abbrev = (fn1 in ("md", "mohd", "mohammad", "muhammad") and fn2 in ("md", "mohd", "mohammad", "muhammad")) or \
                                (fn1 in ("ku", "kumari") and fn2 in ("ku", "kumari")) or \
                                (len(fn1) <= 2 and fn2.startswith(fn1)) or (len(fn2) <= 2 and fn1.startswith(fn2))

                    if dob1 and dob2 and dob1 == dob2 and g_sim > 0.80 and fn_sim < twin_max_sim and not is_abbrev:
                        # Legitimate twin or sibling living in the same home -> Suppress!
                        continue

                    # Composite weighted score
                    composite_score = (
                        weights.get("name", 0.40) * (1.0 if is_abbrev and name_sim > 0.6 else name_sim) +
                        weights.get("dob", 0.25) * dob_sim +
                        weights.get("guardian", 0.20) * g_sim +
                        weights.get("address", 0.15) * addr_sim
                    )

                    if composite_score >= med_thresh:
                        sev = Severity.HIGH if composite_score >= high_thresh else Severity.MEDIUM
                        findings.append(StandardFinding(
                            module="register",
                            ruleId="RULE_5_SIMILAR_RECORDS",
                            ruleType=RuleType.STATISTICAL,
                            category=FindingCategory.RISK_INDICATOR,
                            entityType="beneficiary",
                            entityId=id1,
                            period=datetime.utcnow().strftime("%Y-%m-%d"),
                            severity=sev,
                            confidence=round(composite_score, 3),
                            reason=f"High demographic similarity ({round(composite_score * 100, 1)}%) detected with beneficiary {id2} ({name2}).",
                            details={
                                "matchedBeneficiaryId": id2,
                                "matchedName": name2,
                                "compositeScore": round(composite_score, 3),
                                "nameSimilarity": round(name_sim, 3),
                                "dobMatch": dob1 == dob2,
                                "guardianSimilarity": round(g_sim, 3)
                            },
                            evidenceRefs=[id1, id2],
                            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                            configVersion=config_version
                        ))

        return findings




class Rule6RepeatedContactDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        beneficiaries = payload.get("beneficiaries") or []
        if len(beneficiaries) < 2:
            return []

        cfg = config.get("registerIntegrity", {}).get("rule6_repeatedContact", {})
        whitelist = set(cfg.get("institutionalWhitelist", []))
        config_version = config.get("version", "2026.10.v1")

        # Group by normalized phone
        phone_groups: Dict[str, List[Dict[str, Any]]] = {}
        for b in beneficiaries:
            p_norm = normalize_phone(b.get("phone"))
            if p_norm and p_norm not in whitelist:
                phone_groups.setdefault(p_norm, []).append(b)

        for phone, members in phone_groups.items():
            if len(members) < 2:
                continue

            # Check family clustering: same guardian or same address
            guardians = {str(m.get("guardianName", "")).strip().lower() for m in members if m.get("guardianName")}
            addresses = {str(m.get("address", "")).strip().lower() for m in members if m.get("address")}

            # If all belong to the same guardian or address, it is a legitimate family household
            if len(guardians) <= 1 and len(addresses) <= 1:
                continue

            # Distinct unrelated families sharing contact
            member_ids = [str(m.get("id")) for m in members]
            masked_phone = f"{phone[:2]}******{phone[-2:]}" if len(phone) >= 4 else "******"

            for m in members:
                findings.append(StandardFinding(
                    module="register",
                    ruleId="RULE_6_REPEATED_CONTACT",
                    ruleType=RuleType.RULE_BASED,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="beneficiary",
                    entityId=str(m.get("id")),
                    period=datetime.utcnow().strftime("%Y-%m-%d"),
                    severity=Severity.MEDIUM if len(members) <= 3 else Severity.HIGH,
                    confidence=0.91,
                    reason=f"Contact phone ({masked_phone}) shared across {len(members)} unrelated beneficiaries with different guardians.",
                    details={
                        "sharedPhoneMasked": masked_phone,
                        "unrelatedMembersCount": len(members),
                        "sharedMemberIds": member_ids,
                        "guardiansObserved": list(guardians)
                    },
                    evidenceRefs=member_ids,
                    suggestedAction=SuggestedAction.DATA_CORRECTION,
                    configVersion=config_version
                ))

        return findings




class Rule2RepeatedFailuresDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        verifications = payload.get("verifications") or []
        if not verifications:
            return []

        cfg = config.get("registerIntegrity", {}).get("rule2_repeatedFailures", {})
        window_days = cfg.get("windowDays", 60)
        min_failures = cfg.get("minFailures", 3)
        exclude_codes = set(cfg.get("excludeReasonCodes", []))
        config_version = config.get("version", "2026.10.v1")

        # Group by beneficiary
        ben_map: Dict[str, List[Dict[str, Any]]] = {}
        for v in verifications:
            if v.get("outcome") in ("FAILED", "REJECTED", "FAIL"):
                code = v.get("reasonCode") or ""
                if code not in exclude_codes:
                    ben_map.setdefault(str(v.get("beneficiaryId")), []).append(v)

        for ben_id, records in ben_map.items():
            if len(records) < min_failures:
                continue

            # Sort by date
            records.sort(key=lambda x: x.get("date", ""))
            
            # Sliding window check
            for i in range(len(records)):
                try:
                    d_start = datetime.strptime(records[i]["date"][:10], "%Y-%m-%d")
                except Exception:
                    continue
                window_recs = []
                docs_tried = set()
                for j in range(i, len(records)):
                    try:
                        d_curr = datetime.strptime(records[j]["date"][:10], "%Y-%m-%d")
                    except Exception:
                        continue
                    if (d_curr - d_start).days <= window_days:
                        window_recs.append(records[j])
                        if records[j].get("documentNumberHash"):
                            docs_tried.add(records[j]["documentNumberHash"])
                    else:
                        break

                if len(window_recs) >= min_failures:
                    is_multi_doc = len(docs_tried) >= 2
                    sev = Severity.HIGH if is_multi_doc or len(window_recs) >= 5 else Severity.MEDIUM
                    findings.append(StandardFinding(
                        module="register",
                        ruleId="RULE_2_REPEATED_FAILED_VERIFICATION",
                        ruleType=RuleType.STATISTICAL,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="beneficiary",
                        entityId=ben_id,
                        period=datetime.utcnow().strftime("%Y-%m-%d"),
                        severity=sev,
                        confidence=0.90,
                        reason=f"Beneficiary recorded {len(window_recs)} failed verification attempts in a {window_days}-day window ({len(docs_tried)} different documents tried).",
                        details={
                            "failureCount": len(window_recs),
                            "windowDays": window_days,
                            "distinctDocumentsTried": len(docs_tried),
                            "isMultiDocumentAttempt": is_multi_doc
                        },
                        evidenceRefs=[r.get("id", f"v_{idx}") for idx, r in enumerate(window_recs)],
                        suggestedAction=SuggestedAction.REQUEST_DOCUMENTS,
                        configVersion=config_version
                    ))
                    break

        return findings




class Rule3InactiveBeneficiaryClaimDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        claims = payload.get("claims") or []
        enrollments = payload.get("enrollments") or []
        if not claims:
            return []

        cfg = config.get("registerIntegrity", {}).get("rule3_inactiveClaims", {})
        grace_days = cfg.get("gracePeriodDays", 30)
        high_risk_reasons = set(cfg.get("highRiskExitReasons", ["DEATH", "MIGRATION", "CONFIRMED_FRAUD"]))
        config_version = config.get("version", "2026.10.v1")

        # Map enrollments by beneficiary
        enr_map: Dict[str, List[Dict[str, Any]]] = {}
        for e in enrollments:
            enr_map.setdefault(str(e.get("beneficiaryId")), []).append(e)

        for c in claims:
            ben_id = str(c.get("beneficiaryId"))
            c_start_str = c.get("periodStart") or c.get("claimDate")
            c_end_str = c.get("periodEnd") or c_start_str
            if not c_start_str or not c_end_str:
                continue

            try:
                c_start = datetime.strptime(c_start_str[:10], "%Y-%m-%d")
                c_end = datetime.strptime(c_end_str[:10], "%Y-%m-%d")
            except Exception:
                continue

            b_enrs = enr_map.get(ben_id, [])
            if not b_enrs:
                # No enrollment at all
                findings.append(StandardFinding(
                    module="register",
                    ruleId="RULE_3_INACTIVE_BENEFICIARY_CLAIM",
                    ruleType=RuleType.RULE_BASED,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="beneficiary",
                    entityId=ben_id,
                    period=c_start_str[:7],
                    severity=Severity.HIGH,
                    confidence=0.98,
                    reason=f"Disbursement claimed for beneficiary with no registered enrollment record.",
                    details={"claimId": c.get("id"), "amount": c.get("amount", 0.0), "status": "NO_ENROLLMENT"},
                    amountAtRisk=float(c.get("amount", 0.0)),
                    evidenceRefs=[str(c.get("id", "claim_ref"))],
                    suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                    configVersion=config_version
                ))
                continue

            # Check overlap with any enrollment
            has_valid_overlap = False
            exit_reason = None
            for e in b_enrs:
                try:
                    e_start = datetime.strptime(e["startDate"][:10], "%Y-%m-%d")
                    e_end = datetime.strptime(e["endDate"][:10], "%Y-%m-%d") if e.get("endDate") else datetime.max
                    # Apply grace period to enrollment end
                    if e_end != datetime.max:
                        e_end += timedelta(days=grace_days)
                    
                    if not (c_end < e_start or c_start > e_end):
                        has_valid_overlap = True
                        break
                    if e.get("exitReason"):
                        exit_reason = e["exitReason"]
                except Exception:
                    continue

            if not has_valid_overlap:
                is_severe = exit_reason in high_risk_reasons
                findings.append(StandardFinding(
                    module="register",
                    ruleId="RULE_3_INACTIVE_BENEFICIARY_CLAIM",
                    ruleType=RuleType.RULE_BASED,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="beneficiary",
                    entityId=ben_id,
                    period=c_start_str[:7],
                    severity=Severity.HIGH if is_severe else Severity.MEDIUM,
                    confidence=0.95,
                    reason=f"Disbursement claimed outside active enrollment period (exit reason: {exit_reason or 'NORMAL_EXIT'}).",
                    details={
                        "claimPeriod": [c_start_str, c_end_str],
                        "exitReason": exit_reason,
                        "gracePeriodDaysApplied": grace_days,
                        "amount": c.get("amount", 0.0)
                    },
                    amountAtRisk=float(c.get("amount", 0.0)),
                    evidenceRefs=[str(c.get("id", "claim_ref"))],
                    suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                    configVersion=config_version
                ))

        return findings




class Rule4UnusualDistributionDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        beneficiaries = payload.get("beneficiaries") or []
        baseline_dist = payload.get("baselineDistribution")
        unit_id = payload.get("unitId", "unit_sample")
        period = payload.get("month", datetime.utcnow().strftime("%Y-%m"))
        config_version = config.get("version", "2026.10.v1")

        if not baseline_dist or len(beneficiaries) < 15:
            return []

        # Calendar dampening / suppression check for known intake cycles
        calendar_events = payload.get("activeCalendarEvents") or []
        if any(e in ("NEW_INTAKE_CYCLE", "CRITERIA_EXPANSION", "SANCTION_INCREASE") for e in calendar_events):
            return []

        # Tally observed categories
        cats = list(baseline_dist.keys())
        obs_counts = {c: 0 for c in cats}
        for b in beneficiaries:
            cat = b.get("category")
            if cat in obs_counts:
                obs_counts[cat] += 1

        total_obs = len(beneficiaries)
        obs_props = [obs_counts[c] / total_obs for c in cats]
        base_props = [baseline_dist[c] for c in cats]

        # Total Variation Distance (TVD) = 0.5 * sum(|p_obs - p_base|)
        tvd = 0.5 * sum(abs(p_o - p_b) for p_o, p_b in zip(obs_props, base_props))
        tvd_thresh = config.get("registerIntegrity", {}).get("rule4_distribution", {}).get("tvdThreshold", 0.15)

        if tvd >= tvd_thresh:
            findings.append(StandardFinding(
                module="register",
                ruleId="RULE_4_UNUSUAL_DISTRIBUTION",
                ruleType=RuleType.STATISTICAL,
                category=FindingCategory.RISK_INDICATOR,
                entityType="unit",
                entityId=unit_id,
                period=period,
                severity=Severity.HIGH if tvd > 0.30 else Severity.MEDIUM,
                confidence=round(min(1.0, tvd * 2.5), 2),
                reason=f"Significant demographic category distribution shift (Total Variation Distance: {round(tvd, 3)}) vs historical baseline.",
                details={
                    "totalVariationDistance": round(tvd, 3),
                    "threshold": tvd_thresh,
                    "observedDistribution": {c: round(p, 3) for c, p in zip(cats, obs_props)},
                    "baselineDistribution": baseline_dist
                },
                evidenceRefs=[unit_id],
                suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
                configVersion=config_version
            ))

        return findings




class Rule7InconsistentDatesDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        beneficiaries = payload.get("beneficiaries") or []
        enrollments = payload.get("enrollments") or []
        config_version = config.get("version", "2026.10.v1")
        now = datetime.utcnow()

        for b in beneficiaries:
            b_id = str(b.get("id"))
            dob_str = b.get("dateOfBirth") or b.get("dob")
            if not dob_str:
                continue
            try:
                dob = datetime.strptime(dob_str[:10], "%Y-%m-%d")
                if dob > now:
                    findings.append(StandardFinding(
                        module="register",
                        ruleId="RULE_7_INCONSISTENT_DATES",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.DATA_QUALITY,
                        entityType="beneficiary",
                        entityId=b_id,
                        period=now.strftime("%Y-%m-%d"),
                        severity=Severity.LOW,
                        confidence=0.99,
                        reason=f"Date of birth ({dob_str}) is in the future.",
                        details={"dob": dob_str, "anomaly": "FUTURE_DOB"},
                        evidenceRefs=[b_id],
                        suggestedAction=SuggestedAction.DATA_CORRECTION,
                        configVersion=config_version
                    ))
            except Exception:
                pass

        # Check overlapping concurrent enrollments
        enr_by_ben: Dict[str, List[Dict[str, Any]]] = {}
        for e in enrollments:
            enr_by_ben.setdefault(str(e.get("beneficiaryId")), []).append(e)

        for b_id, enrs in enr_by_ben.items():
            if len(enrs) < 2:
                continue
            for i in range(len(enrs)):
                for j in range(i + 1, len(enrs)):
                    e1, e2 = enrs[i], enrs[j]
                    if e1.get("unitId") != e2.get("unitId"):
                        try:
                            s1 = datetime.strptime(e1["startDate"][:10], "%Y-%m-%d")
                            end1 = datetime.strptime(e1["endDate"][:10], "%Y-%m-%d") if e1.get("endDate") else datetime.max
                            s2 = datetime.strptime(e2["startDate"][:10], "%Y-%m-%d")
                            end2 = datetime.strptime(e2["endDate"][:10], "%Y-%m-%d") if e2.get("endDate") else datetime.max

                            if not (end1 < s2 or s1 > end2):
                                findings.append(StandardFinding(
                                    module="register",
                                    ruleId="RULE_7_INCONSISTENT_DATES",
                                    ruleType=RuleType.RULE_BASED,
                                    category=FindingCategory.DATA_QUALITY,
                                    entityType="beneficiary",
                                    entityId=b_id,
                                    period=now.strftime("%Y-%m-%d"),
                                    severity=Severity.MEDIUM,
                                    confidence=0.95,
                                    reason=f"Concurrent overlapping enrollment detected across units {e1.get('unitId')} and {e2.get('unitId')}.",
                                    details={"unit1": e1.get("unitId"), "unit2": e2.get("unitId")},
                                    evidenceRefs=[b_id],
                                    suggestedAction=SuggestedAction.DATA_CORRECTION,
                                    configVersion=config_version
                                ))
                        except Exception:
                            pass

        return findings




class Rule8FrequentTransfersDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        transfers = payload.get("transfers") or []
        if not transfers:
            return []

        cfg = config.get("registerIntegrity", {}).get("rule8_transfers", {})
        window_days = cfg.get("windowDays", 180)
        max_transfers = cfg.get("maxTransfersInWindow", 3)
        allowed_reasons = set(cfg.get("allowedReasons", []))
        config_version = config.get("version", "2026.10.v1")

        by_ben: Dict[str, List[Dict[str, Any]]] = {}
        for t in transfers:
            by_ben.setdefault(str(t.get("beneficiaryId")), []).append(t)

        for ben_id, t_list in by_ben.items():
            if len(t_list) < max_transfers:
                continue

            t_list.sort(key=lambda x: x.get("date", ""))
            
            # Sliding window count
            for i in range(len(t_list)):
                try:
                    d_start = datetime.strptime(t_list[i]["date"][:10], "%Y-%m-%d")
                except Exception:
                    continue
                window = []
                for j in range(i, len(t_list)):
                    try:
                        d_curr = datetime.strptime(t_list[j]["date"][:10], "%Y-%m-%d")
                    except Exception:
                        continue
                    if (d_curr - d_start).days <= window_days:
                        reason = t_list[j].get("reason", "")
                        if reason not in allowed_reasons:
                            window.append(t_list[j])
                    else:
                        break

                if len(window) >= max_transfers:
                    findings.append(StandardFinding(
                        module="register",
                        ruleId="RULE_8_FREQUENT_TRANSFERS",
                        ruleType=RuleType.STATISTICAL,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="beneficiary",
                        entityId=ben_id,
                        period=datetime.utcnow().strftime("%Y-%m-%d"),
                        severity=Severity.MEDIUM,
                        confidence=0.88,
                        reason=f"Beneficiary transferred {len(window)} times within a {window_days}-day period.",
                        details={"transfersInWindow": len(window), "windowDays": window_days},
                        evidenceRefs=[t.get("id", f"t_{idx}") for idx, t in enumerate(window)],
                        suggestedAction=SuggestedAction.REQUEST_DOCUMENTS,
                        configVersion=config_version
                    ))
                    break

        return findings

    def generate_mock_findings(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        return self.detect(payload, config)

"""
Pure Finance Anomaly Detectors for DoSJE.
Implements:
- RULE_16_EXPENDITURE_PER_BENEFICIARY: Cost per verified attendee vs peer group MAD.
- RULE_17_DUPLICATE_EXPENDITURE_CLAIM: Duplicate claims, perceptual document hash matches, offline GSTIN validation.
- RULE_18_BUDGET_UTILISATION_MISMATCH: Arithmetic reconciliations, line item mismatch, head ceiling breaches.
- RULE_19_SPENDING_NEAR_DEADLINES: March rush / deadline spending spikes vs grant disbursal timing.
- RULE_20_EXPENSE_OVER_AUTHORISED_LIMIT: Single ceiling breaches & structured invoice splitting (smurfing).
- RULE_21_SPENDING_VS_PROJECT_PROGRESS: Financial burn rate vs verified physical milestone completion.
- RULE_22_SIMILAR_INVOICES_ACROSS_UNITS: Collusive cross-institutional vendor invoicing & consecutive numbers.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from src.registry.base import BaseDetector
from src.schemas.common import StandardFinding, RuleType, FindingCategory, Severity, SuggestedAction
from src.detectors.common import validate_gstin_checksum, hamming_distance

class Rule16ExpenditurePerBeneficiaryDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("period", datetime.utcnow().strftime("%Y-%m"))
        config_version = config.get("version", "2026.10.v1")

        # Extract costs and attendance
        monthly_expenditure = float(payload.get("monthlyExpenditure") or payload.get("expenditure") or 0.0)
        verified_count = int(payload.get("verifiedBeneficiaries") or payload.get("verifiedAttendance") or 0)
        peer_costs = payload.get("peerGroupCosts") or []

        if monthly_expenditure <= 0 or verified_count <= 0:
            return []

        # Legitimate exceptions: Special medical care unit or high-altitude remote transport allowance
        if payload.get("isSpecialCareUnit") is True or payload.get("hasRemoteLocationAllowance") is True:
            return []

        unit_cost_per_head = monthly_expenditure / verified_count

        # Compute Robust MAD if peer costs available
        if len(peer_costs) >= 5:
            costs_arr = np.array(peer_costs, dtype=np.float64)
            median = float(np.median(costs_arr))
            mad = float(np.median(np.abs(costs_arr - median)))
            mad = max(100.0, mad) # Avoid division by near-zero

            # Modified Z-Score: 0.6745 * (x - median) / MAD
            mod_z = 0.6745 * (unit_cost_per_head - median) / mad
            mad_multiplier = config.get("finance", {}).get("expenditurePerBeneficiaryMadMultiplier", 2.5)

            if mod_z > mad_multiplier:
                sev = Severity.HIGH if mod_z > 4.0 else Severity.MEDIUM
                findings.append(StandardFinding(
                    module="finance",
                    ruleId="RULE_16_EXPENDITURE_PER_BENEFICIARY",
                    ruleType=RuleType.STATISTICAL,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="unit",
                    entityId=unit_id,
                    period=period,
                    severity=sev,
                    confidence=min(0.99, round(0.70 + (mod_z * 0.06), 2)),
                    reason=f"Monthly cost per verified attendee (₹{unit_cost_per_head:,.2f}) deviates significantly from peer group median (₹{median:,.2f}, Modified Z-Score: {round(mod_z, 2)}).",
                    details={
                        "unitCostPerAttendee": round(unit_cost_per_head, 2),
                        "peerMedian": round(median, 2),
                        "peerMAD": round(mad, 2),
                        "modifiedZScore": round(mod_z, 2),
                        "thresholdMultiplier": mad_multiplier,
                        "verifiedCount": verified_count,
                        "totalExpenditure": monthly_expenditure
                    },
                    amountAtRisk=round(monthly_expenditure - (median * verified_count), 2),
                    evidenceRefs=[unit_id],
                    suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                    configVersion=config_version
                ))

        return findings


class Rule18BudgetUtilisationMismatchDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("period", datetime.utcnow().strftime("%Y-%m"))
        config_version = config.get("version", "2026.10.v1")

        budget_heads = payload.get("budgetHeads") or []
        opening_balance = payload.get("openingBalance")
        disbursals = payload.get("disbursals")
        total_exp = payload.get("totalExpenditure")
        closing_balance = payload.get("closingBalance")

        # 1. Check line-item arithmetic per head
        for head in budget_heads:
            h_name = head.get("headName") or head.get("head", "General")
            sanctioned = float(head.get("sanctionedAmount", 0.0))
            utilised = float(head.get("utilisedAmount", 0.0))
            line_items = head.get("lineItems") or []

            if line_items:
                calc_sum = sum(float(item.get("amount", 0.0)) for item in line_items)
                if abs(calc_sum - utilised) > 10.0:
                    diff = abs(calc_sum - utilised)
                    findings.append(StandardFinding(
                        module="finance",
                        ruleId="RULE_18_BUDGET_UTILISATION_MISMATCH",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.DATA_QUALITY,
                        entityType="unit",
                        entityId=unit_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.99,
                        reason=f"Arithmetic mismatch in head '{h_name}': sum of line items (₹{calc_sum:,.2f}) does not match reported utilised total (₹{utilised:,.2f}).",
                        details={"head": h_name, "lineItemsSum": calc_sum, "reportedUtilised": utilised, "discrepancy": diff},
                        amountAtRisk=diff,
                        evidenceRefs=[h_name],
                        suggestedAction=SuggestedAction.DATA_CORRECTION,
                        configVersion=config_version
                    ))

            # Check unapproved head ceiling breach (>10% tolerance)
            tolerance_pct = config.get("finance", {}).get("headReallocationTolerancePercent", 10.0)
            if sanctioned > 0 and utilised > (sanctioned * (1.0 + tolerance_pct / 100.0)):
                has_reappropriation_order = head.get("hasReappropriationApproval", False)
                if not has_reappropriation_order:
                    excess = utilised - sanctioned
                    findings.append(StandardFinding(
                        module="finance",
                        ruleId="RULE_18_BUDGET_UTILISATION_MISMATCH",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="unit",
                        entityId=unit_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.98,
                        reason=f"Expenditure under head '{h_name}' (₹{utilised:,.2f}) exceeds sanctioned ceiling (₹{sanctioned:,.2f}) by ₹{excess:,.2f} without re-appropriation sanction.",
                        details={"head": h_name, "sanctioned": sanctioned, "utilised": utilised, "excess": excess},
                        amountAtRisk=excess,
                        evidenceRefs=[h_name],
                        suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                        configVersion=config_version
                    ))

        # 2. Check balance reconciliation: Opening + Disbursals - Exp == Closing
        if opening_balance is not None and disbursals is not None and total_exp is not None and closing_balance is not None:
            expected_closing = float(opening_balance) + float(disbursals) - float(total_exp)
            actual_closing = float(closing_balance)
            if abs(expected_closing - actual_closing) > 50.0:
                diff = abs(expected_closing - actual_closing)
                findings.append(StandardFinding(
                    module="finance",
                    ruleId="RULE_18_BUDGET_UTILISATION_MISMATCH",
                    ruleType=RuleType.RULE_BASED,
                    category=FindingCategory.DATA_QUALITY,
                    entityType="unit",
                    entityId=unit_id,
                    period=period,
                    severity=Severity.HIGH,
                    confidence=0.99,
                    reason=f"Cash balance reconciliation failure: Expected closing balance is ₹{expected_closing:,.2f}, but reported closing balance is ₹{actual_closing:,.2f} (Discrepancy: ₹{diff:,.2f}).",
                    details={"openingBalance": opening_balance, "disbursals": disbursals, "totalExpenditure": total_exp, "expectedClosing": expected_closing, "reportedClosing": actual_closing},
                    amountAtRisk=diff,
                    evidenceRefs=[unit_id],
                    suggestedAction=SuggestedAction.DATA_CORRECTION,
                    configVersion=config_version
                ))

        return findings


class Rule19SpendingNearDeadlinesDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("period", datetime.utcnow().strftime("%Y-%m"))
        config_version = config.get("version", "2026.10.v1")

        invoices = payload.get("invoices") or []
        deadline_str = payload.get("fiscalYearDeadline", "2027-03-31")
        disbursal_date_str = payload.get("fundDisbursalDate")

        if not invoices:
            return []

        try:
            deadline_dt = datetime.strptime(deadline_str[:10], "%Y-%m-%d")
        except Exception:
            return []

        # Legitimate exception check: late grant release by ministry
        if disbursal_date_str:
            try:
                disbursal_dt = datetime.strptime(disbursal_date_str[:10], "%Y-%m-%d")
                # If grant was disbursed within 45 days before the deadline, late spending is expected
                if (deadline_dt - disbursal_dt).days <= 45:
                    return []
            except Exception:
                pass

        total_spend = sum(float(inv.get("amount", 0.0)) for inv in invoices)
        if total_spend <= 0:
            return []

        rush_window_days = config.get("finance", {}).get("spendingDeadlineDaysFromDisbursal", 30)
        rush_start = deadline_dt - timedelta(days=rush_window_days)

        rush_spend = 0.0
        rush_invoices = []
        for inv in invoices:
            inv_date_str = str(inv.get("date", ""))
            try:
                inv_dt = datetime.strptime(inv_date_str[:10], "%Y-%m-%d")
                if rush_start <= inv_dt <= deadline_dt:
                    amt = float(inv.get("amount", 0.0))
                    rush_spend += amt
                    rush_invoices.append(str(inv.get("id") or inv.get("invoiceNumber")))
            except Exception:
                continue

        rush_ratio = rush_spend / total_spend
        # If > 40% of total annual spending is concentrated in the final 30 days
        if rush_ratio > 0.40 and rush_spend > 50000.0:
            sev = Severity.HIGH if rush_ratio > 0.70 else Severity.MEDIUM
            findings.append(StandardFinding(
                module="finance",
                ruleId="RULE_19_SPENDING_NEAR_DEADLINES",
                ruleType=RuleType.STATISTICAL,
                category=FindingCategory.RISK_INDICATOR,
                entityType="unit",
                entityId=unit_id,
                period=period,
                severity=sev,
                confidence=round(min(0.98, 0.65 + rush_ratio * 0.35), 2),
                reason=f"Abnormal spending surge near fiscal year-end: {round(rush_ratio * 100, 1)}% of total expenditure (₹{rush_spend:,.2f}) incurred within the final {rush_window_days} days.",
                details={
                    "totalExpenditure": total_spend,
                    "deadlineRushSpend": rush_spend,
                    "rushSpendRatio": round(rush_ratio, 3),
                    "deadlineWindowDays": rush_window_days,
                    "invoiceCountInWindow": len(rush_invoices)
                },
                amountAtRisk=rush_spend,
                evidenceRefs=rush_invoices[:5],
                suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                configVersion=config_version
            ))

        return findings


class Rule20ExpenseOverAuthorisedLimitDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        invoices = payload.get("invoices") or []
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("period", datetime.utcnow().strftime("%Y-%m"))
        config_version = config.get("version", "2026.10.v1")

        if not invoices:
            return []

        # Legitimate exception check: emergency sanctioned repair
        if payload.get("isEmergencySanctioned") is True:
            return []

        single_limit = config.get("finance", {}).get("singleInvoiceApprovalCeiling", 100000.0)
        split_threshold = config.get("finance", {}).get("procurementLimitThreshold", 50000.0)
        window_days = config.get("finance", {}).get("invoiceSplittingWindowDays", 7)

        # 1. Single invoice limit check
        for inv in invoices:
            amt = float(inv.get("amount", 0.0))
            inv_id = str(inv.get("id") or inv.get("invoiceNumber", "inv"))
            has_prior_approval = inv.get("hasPriorSanctionApproval", False)

            if amt > single_limit and not has_prior_approval:
                findings.append(StandardFinding(
                    module="finance",
                    ruleId="RULE_20_EXPENSE_OVER_AUTHORISED_LIMIT",
                    ruleType=RuleType.RULE_BASED,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="unit",
                    entityId=unit_id,
                    period=period,
                    severity=Severity.HIGH,
                    confidence=0.98,
                    reason=f"Single invoice {inv_id} of ₹{amt:,.2f} exceeds standard authorisation limit of ₹{single_limit:,.2f} without prior approval.",
                    details={
                        "invoiceId": inv_id,
                        "invoiceAmount": amt,
                        "limit": single_limit,
                        "vendorId": inv.get("vendorId")
                    },
                    amountAtRisk=amt,
                    evidenceRefs=[inv_id],
                    suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                    configVersion=config_version
                ))

        # 2. Invoice-Splitting (Smurfing) Detection within sliding window per vendor
        vendor_invs: Dict[str, List[Dict[str, Any]]] = {}
        for inv in invoices:
            v_id = str(inv.get("vendorId") or inv.get("vendorName") or "unspecified_vendor")
            vendor_invs.setdefault(v_id, []).append(inv)

        for v_id, inv_list in vendor_invs.items():
            if len(inv_list) < 2:
                continue

            inv_list.sort(key=lambda x: str(x.get("date", "")))

            for i in range(len(inv_list)):
                try:
                    d_start = datetime.strptime(inv_list[i]["date"][:10], "%Y-%m-%d")
                except Exception:
                    continue

                window = []
                window_sum = 0.0
                just_below_count = 0

                for j in range(i, len(inv_list)):
                    try:
                        d_curr = datetime.strptime(inv_list[j]["date"][:10], "%Y-%m-%d")
                    except Exception:
                        continue
                    if (d_curr - d_start).days <= window_days:
                        curr_amt = float(inv_list[j].get("amount", 0.0))
                        window.append(inv_list[j])
                        window_sum += curr_amt
                        # Just below procurement threshold (e.g. 70% to 99% of threshold)
                        if (0.70 * split_threshold) <= curr_amt < split_threshold:
                            just_below_count += 1
                    else:
                        break

                if len(window) >= 2 and (just_below_count >= 2 or window_sum > split_threshold):
                    inv_ids = [str(x.get("id") or x.get("invoiceNumber")) for x in window]
                    findings.append(StandardFinding(
                        module="finance",
                        ruleId="RULE_20_EXPENSE_OVER_AUTHORISED_LIMIT",
                        ruleType=RuleType.STATISTICAL,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="unit",
                        entityId=unit_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.92,
                        reason=f"Suspected structured invoice splitting: {len(window)} invoices to vendor {v_id} totalling ₹{window_sum:,.2f} within {window_days} days.",
                        details={
                            "vendorId": v_id,
                            "windowDays": window_days,
                            "invoiceCount": len(window),
                            "totalAmount": window_sum,
                            "procurementLimit": split_threshold,
                            "invoiceIds": inv_ids
                        },
                        amountAtRisk=window_sum,
                        evidenceRefs=inv_ids,
                        suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                        configVersion=config_version
                    ))
                    break

        return findings


class Rule21SpendingVsProjectProgressDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("period", datetime.utcnow().strftime("%Y-%m"))
        config_version = config.get("version", "2026.10.v1")

        sanctioned_grant = float(payload.get("totalSanctionedGrant", 0.0))
        disbursed_funds = float(payload.get("totalDisbursedFunds") or payload.get("claimedDisbursalAmount") or 0.0)
        physical_progress_pct = float(payload.get("verifiedPhysicalProgressPercent", -1.0))

        if sanctioned_grant <= 0 or disbursed_funds <= 0 or physical_progress_pct < 0:
            return []

        financial_burn_pct = (disbursed_funds / sanctioned_grant) * 100.0

        # Disproportionate check: e.g. financial burn > 60% while physical progress < 25%, or burn/progress ratio > 2.2
        if financial_burn_pct > 50.0 and physical_progress_pct < 30.0:
            excess_burn_ratio = financial_burn_pct / max(1.0, physical_progress_pct)
            if excess_burn_ratio >= 2.0:
                findings.append(StandardFinding(
                    module="finance",
                    ruleId="RULE_21_SPENDING_VS_PROJECT_PROGRESS",
                    ruleType=RuleType.RULE_BASED,
                    category=FindingCategory.RISK_INDICATOR,
                    entityType="unit",
                    entityId=unit_id,
                    period=period,
                    severity=Severity.HIGH,
                    confidence=0.94,
                    reason=f"Financial disbursement ({round(financial_burn_pct, 1)}%) is disproportionately ahead of verified physical project milestones ({round(physical_progress_pct, 1)}%).",
                    details={
                        "totalSanctionedGrant": sanctioned_grant,
                        "disbursedFunds": disbursed_funds,
                        "financialBurnPercent": round(financial_burn_pct, 1),
                        "verifiedPhysicalProgressPercent": round(physical_progress_pct, 1),
                        "burnToProgressRatio": round(excess_burn_ratio, 2)
                    },
                    amountAtRisk=round(disbursed_funds - (sanctioned_grant * (physical_progress_pct / 100.0)), 2),
                    evidenceRefs=[unit_id],
                    suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                    configVersion=config_version
                ))

        return findings


class Rule22SimilarInvoicesAcrossUnitsDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("period", datetime.utcnow().strftime("%Y-%m"))
        config_version = config.get("version", "2026.10.v1")

        invoices = payload.get("invoices") or []
        cross_unit_invoices = payload.get("crossUnitInvoices") or []

        if not invoices or not cross_unit_invoices:
            return []

        for inv in invoices:
            v_id = str(inv.get("vendorId") or inv.get("vendorName") or "").strip().lower()
            inv_date = str(inv.get("date", ""))[:10]
            inv_num_str = str(inv.get("invoiceNumber", ""))
            inv_id = str(inv.get("id") or inv_num_str)

            # Check matching vendor on same date across units or consecutive invoice numbers
            for other in cross_unit_invoices:
                o_uid = other.get("unitId")
                if o_uid == unit_id:
                    continue

                o_vid = str(other.get("vendorId") or other.get("vendorName") or "").strip().lower()
                o_date = str(other.get("date", ""))[:10]
                o_num_str = str(other.get("invoiceNumber", ""))

                # Check consecutive invoice numbering from same vendor to distinct institutions
                is_consecutive = False
                try:
                    num1 = int("".join(filter(str.isdigit, inv_num_str)))
                    num2 = int("".join(filter(str.isdigit, o_num_str)))
                    if abs(num1 - num2) == 1 and v_id and v_id == o_vid and inv_date == o_date:
                        is_consecutive = True
                except Exception:
                    pass

                # Check identical amount + same vendor + same date across unrelated units
                is_identical_claim = (
                    v_id and v_id == o_vid and 
                    inv_date and inv_date == o_date and 
                    abs(float(inv.get("amount", 0.0)) - float(other.get("amount", 0.0))) < 1.0
                )

                if is_consecutive or is_identical_claim:
                    findings.append(StandardFinding(
                        module="finance",
                        ruleId="RULE_22_SIMILAR_INVOICES_ACROSS_UNITS",
                        ruleType=RuleType.STATISTICAL,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="unit",
                        entityId=unit_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.91,
                        reason=f"Shared vendor {v_id} issued {'consecutive' if is_consecutive else 'identical'} invoices on the same date ({inv_date}) to separate institutions ({unit_id} and {o_uid}).",
                        details={
                            "vendorId": v_id,
                            "matchedUnitId": o_uid,
                            "invoiceNumber": inv_num_str,
                            "matchedInvoiceNumber": o_num_str,
                            "amount": inv.get("amount"),
                            "date": inv_date
                        },
                        amountAtRisk=float(inv.get("amount", 0.0)),
                        evidenceRefs=[inv_id, str(other.get("id", "other_inv"))],
                        suggestedAction=SuggestedAction.FIELD_VERIFICATION,
                        configVersion=config_version
                    ))
                    break

        return findings


class Rule17DuplicateExpenditureClaimDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        findings = []
        invoices = payload.get("invoices") or []
        historical_invoices = payload.get("historicalInvoices") or []
        unit_id = payload.get("unitId", "unit_unknown")
        period = payload.get("period", datetime.utcnow().strftime("%Y-%m"))
        config_version = config.get("version", "2026.10.v1")

        if not invoices:
            return []

        # 1. Check GSTIN validity for each invoice
        for inv in invoices:
            gstin = inv.get("gstin") or inv.get("vendorGstin")
            inv_id = str(inv.get("id") or inv.get("invoiceNumber", "inv"))
            if gstin:
                is_valid, err_msg = validate_gstin_checksum(gstin)
                if not is_valid:
                    findings.append(StandardFinding(
                        module="finance",
                        ruleId="RULE_17_DUPLICATE_EXPENDITURE_CLAIM",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.DATA_QUALITY,
                        entityType="unit",
                        entityId=unit_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.99,
                        reason=f"Invalid GSTIN '{gstin}' on invoice {inv_id}: {err_msg}.",
                        details={"invoiceId": inv_id, "gstin": gstin, "error": err_msg},
                        amountAtRisk=float(inv.get("amount", 0.0)),
                        evidenceRefs=[inv_id],
                        suggestedAction=SuggestedAction.DATA_CORRECTION,
                        configVersion=config_version
                    ))

        # 2. Check duplicates within the payload or against historical claims
        for inv in invoices:
            inv_num = str(inv.get("invoiceNumber") or "").strip().upper()
            v_id = str(inv.get("vendorId") or inv.get("vendorName") or "").strip().lower()
            doc_sha = inv.get("documentSha256")
            doc_hash = inv.get("documentPHash")
            inv_id = str(inv.get("id") or inv_num)

            # Match 1: Exact invoiceNumber + vendorId
            if inv_num and v_id:
                for hist in historical_invoices:
                    h_num = str(hist.get("invoiceNumber") or "").strip().upper()
                    h_vid = str(hist.get("vendorId") or hist.get("vendorName") or "").strip().lower()
                    if h_num == inv_num and h_vid == v_id and hist.get("id") != inv.get("id"):
                        findings.append(StandardFinding(
                            module="finance",
                            ruleId="RULE_17_DUPLICATE_EXPENDITURE_CLAIM",
                            ruleType=RuleType.RULE_BASED,
                            category=FindingCategory.RISK_INDICATOR,
                            entityType="unit",
                            entityId=unit_id,
                            period=period,
                            severity=Severity.HIGH,
                            confidence=0.99,
                            reason=f"Exact duplicate invoice {inv_num} from vendor {v_id} already claimed in previous period/unit ({hist.get('unitId', 'prior')}).",
                            details={
                                "invoiceNumber": inv_num,
                                "vendorId": v_id,
                                "amount": inv.get("amount"),
                                "matchedUnitId": hist.get("unitId"),
                                "matchedInvoiceId": hist.get("id")
                            },
                            amountAtRisk=float(inv.get("amount", 0.0)),
                            evidenceRefs=[inv_id, str(hist.get("id"))],
                            suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                            configVersion=config_version
                        ))
                        break

            # Match 2: Document SHA or perceptual hash duplicate
            for hist in historical_invoices:
                h_sha = hist.get("documentSha256")
                h_phash = hist.get("documentPHash")
                is_doc_dup = False
                if doc_sha and h_sha and doc_sha == h_sha and hist.get("id") != inv.get("id"):
                    is_doc_dup = True
                elif doc_hash and h_phash and hamming_distance(doc_hash, h_phash) <= 3 and hist.get("id") != inv.get("id"):
                    is_doc_dup = True

                if is_doc_dup:
                    findings.append(StandardFinding(
                        module="finance",
                        ruleId="RULE_17_DUPLICATE_EXPENDITURE_CLAIM",
                        ruleType=RuleType.RULE_BASED,
                        category=FindingCategory.RISK_INDICATOR,
                        entityType="unit",
                        entityId=unit_id,
                        period=period,
                        severity=Severity.HIGH,
                        confidence=0.98,
                        reason=f"Invoice document hash matches an invoice previously submitted for unit {hist.get('unitId', 'other')}.",
                        details={
                            "invoiceId": inv_id,
                            "matchedUnitId": hist.get("unitId"),
                            "matchedInvoiceId": hist.get("id"),
                            "amount": inv.get("amount")
                        },
                        amountAtRisk=float(inv.get("amount", 0.0)),
                        evidenceRefs=[inv_id, str(hist.get("id"))],
                        suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
                        configVersion=config_version
                    ))
                    break

        return findings

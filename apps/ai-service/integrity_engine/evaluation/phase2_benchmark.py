"""
Phase 2 Ground Truth Evaluation Benchmark.
Evaluates Precision, Recall, and False Discovery Rate (FDR) across all Phase 1 and Phase 2 anomaly rules:
- Finance: Rules 16, 17, 18, 19, 20, 21, 22
- Inspection: Rules 23, 24, 25, 26, 27, 28, 29, 30
- Register: Rules 2, 3, 4, 5, 6, 7, 8
- Attendance: Rule 1 sub-checks
"""

from typing import Dict, List, Any
from src.core.scheme_profile import load_scheme_profile
from src.registry.rule_registry import rule_registry
from src.evaluation.phase1_benchmark import generate_benchmark_dataset as generate_phase1_dataset

def generate_phase2_dataset() -> List[Dict[str, Any]]:
    scenarios = list(generate_phase1_dataset())

    # ==========================================
    # PHASE 2 FINANCE SCENARIOS
    # ==========================================
    # Rule 16: Cost per attendee outlier
    scenarios.append({
        "ruleId": "RULE_16_EXPENDITURE_PER_BENEFICIARY",
        "category": "FINANCE",
        "description": "Monthly cost per verified attendee (₹14,000) exceeds peer median (₹3,500, MAD: ₹400)",
        "groundTruth": "POSITIVE",
        "payload": {
            "unitId": "unit_f16_pos",
            "monthlyExpenditure": 280000.0,
            "verifiedBeneficiaries": 20,
            "peerGroupCosts": [3200.0, 3400.0, 3500.0, 3600.0, 3800.0]
        }
    })
    scenarios.append({
        "ruleId": "RULE_16_EXPENDITURE_PER_BENEFICIARY",
        "category": "FINANCE",
        "description": "High per-attendee cost in specialized medical palliative care unit",
        "groundTruth": "LOOKALIKE_EXCEPTION",
        "payload": {
            "unitId": "unit_f16_med",
            "monthlyExpenditure": 280000.0,
            "verifiedBeneficiaries": 20,
            "isSpecialCareUnit": True,
            "peerGroupCosts": [3200.0, 3400.0, 3500.0, 3600.0, 3800.0]
        }
    })

    # Rule 18: Budget Utilisation Mismatch
    scenarios.append({
        "ruleId": "RULE_18_BUDGET_UTILISATION_MISMATCH",
        "category": "FINANCE",
        "description": "Line item sum ₹50,000 does not match reported head total ₹90,000",
        "groundTruth": "POSITIVE",
        "payload": {
            "unitId": "unit_f18_pos",
            "budgetHeads": [{
                "headName": "Rehabilitation",
                "sanctionedAmount": 100000.0,
                "utilisedAmount": 90000.0,
                "lineItems": [{"amount": 25000.0}, {"amount": 25000.0}]
            }]
        }
    })
    scenarios.append({
        "ruleId": "RULE_18_BUDGET_UTILISATION_MISMATCH",
        "category": "FINANCE",
        "description": "Budget head perfectly reconciled with line items",
        "groundTruth": "NEGATIVE",
        "payload": {
            "unitId": "unit_f18_neg",
            "budgetHeads": [{
                "headName": "Rehabilitation",
                "sanctionedAmount": 100000.0,
                "utilisedAmount": 50000.0,
                "lineItems": [{"amount": 25000.0}, {"amount": 25000.0}]
            }]
        }
    })

    # Rule 19: Spending near deadlines
    scenarios.append({
        "ruleId": "RULE_19_SPENDING_NEAR_DEADLINES",
        "category": "FINANCE",
        "description": "85% of annual funds spent in final 7 days before March 31 deadline",
        "groundTruth": "POSITIVE",
        "payload": {
            "unitId": "unit_f19_pos",
            "fiscalYearDeadline": "2027-03-31",
            "fundDisbursalDate": "2026-05-01",
            "invoices": [
                {"id": "inv_1", "date": "2026-06-01", "amount": 15000.0},
                {"id": "inv_rush_1", "date": "2027-03-27", "amount": 50000.0},
                {"id": "inv_rush_2", "date": "2027-03-29", "amount": 50000.0}
            ]
        }
    })
    scenarios.append({
        "ruleId": "RULE_19_SPENDING_NEAR_DEADLINES",
        "category": "FINANCE",
        "description": "Late spending caused by delayed ministry fund release in late March",
        "groundTruth": "LOOKALIKE_EXCEPTION",
        "payload": {
            "unitId": "unit_f19_exc",
            "fiscalYearDeadline": "2027-03-31",
            "fundDisbursalDate": "2027-03-15", # Funds arrived 16 days before deadline
            "invoices": [
                {"id": "inv_rush_1", "date": "2027-03-27", "amount": 50000.0},
                {"id": "inv_rush_2", "date": "2027-03-29", "amount": 50000.0}
            ]
        }
    })

    # Rule 21: Spending vs project progress
    scenarios.append({
        "ruleId": "RULE_21_SPENDING_VS_PROJECT_PROGRESS",
        "category": "FINANCE",
        "description": "Claimed 90% capital budget while only 15% physical structure completed",
        "groundTruth": "POSITIVE",
        "payload": {
            "unitId": "unit_f21_pos",
            "totalSanctionedGrant": 2000000.0,
            "totalDisbursedFunds": 1800000.0,
            "verifiedPhysicalProgressPercent": 15.0
        }
    })

    # Rule 22: Similar invoices across units
    scenarios.append({
        "ruleId": "RULE_22_SIMILAR_INVOICES_ACROSS_UNITS",
        "category": "FINANCE",
        "description": "Consecutive invoice numbers from same vendor issued to separate units on same date",
        "groundTruth": "POSITIVE",
        "payload": {
            "unitId": "unit_f22_u1",
            "invoices": [{"id": "inv_1", "vendorId": "apex_traders", "invoiceNumber": "APEX-501", "date": "2026-10-01", "amount": 40000.0}],
            "crossUnitInvoices": [{"id": "inv_2", "unitId": "unit_f22_u2", "vendorId": "apex_traders", "invoiceNumber": "APEX-502", "date": "2026-10-01", "amount": 40000.0}]
        }
    })

    # ==========================================
    # PHASE 2 INSPECTION SCENARIOS
    # ==========================================
    # Rule 27: Chronic unresolved deficiencies
    scenarios.append({
        "ruleId": "RULE_27_REPEATED_FINDINGS_UNRESOLVED",
        "category": "INSPECTION",
        "description": "Fire safety non-compliance repeated for 3rd successive inspection cycle",
        "groundTruth": "POSITIVE",
        "payload": {
            "unitId": "unit_i27_pos",
            "currentDeficiencies": [{"deficiencyCode": "FIRE_SAFETY", "description": "No operational extinguishers", "consecutiveOccurrences": 3}],
            "historicalDeficiencies": [{"deficiencyCode": "FIRE_SAFETY"}]
        }
    })
    scenarios.append({
        "ruleId": "RULE_27_REPEATED_FINDINGS_UNRESOLVED",
        "category": "INSPECTION",
        "description": "Deficiency covered under magistrate-approved capital rectification plan",
        "groundTruth": "LOOKALIKE_EXCEPTION",
        "payload": {
            "unitId": "unit_i27_plan",
            "hasApprovedRectificationPlan": True,
            "currentDeficiencies": [{"deficiencyCode": "FIRE_SAFETY", "consecutiveOccurrences": 3}],
            "historicalDeficiencies": [{"deficiencyCode": "FIRE_SAFETY"}]
        }
    })

    # Rule 28: Suspicious post-submission edits
    scenarios.append({
        "ruleId": "RULE_28_SUSPICIOUS_POST_SUBMISSION_EDITS",
        "category": "INSPECTION",
        "description": "Rating changed from Deficient to Satisfactory 4 hours after submission without supervisor approval",
        "groundTruth": "POSITIVE",
        "payload": {
            "inspectionId": "insp_i28_pos",
            "modificationAuditLog": [{
                "fieldModified": "sanitation_grade",
                "oldValue": "DEFICIENT",
                "newValue": "SATISFACTORY",
                "minutesAfterFinalSubmission": 240.0,
                "editorId": "officer_sub"
            }]
        }
    })

    # Rule 29: Assignment conflicts & impossible travel
    scenarios.append({
        "ruleId": "RULE_29_ASSIGNMENT_CONFLICTS",
        "category": "INSPECTION",
        "description": "Inspections 200 km apart completed 30 minutes apart (400 km/h impossible travel speed)",
        "groundTruth": "POSITIVE",
        "payload": {
            "inspectorId": "insp_i29_pos",
            "inspectorScheduleVisits": [
                {"unitId": "u_city_a", "startTime": "2026-10-01T09:00:00Z", "endTime": "2026-10-01T10:00:00Z", "location": {"latitude": 28.6139, "longitude": 77.2090}},
                {"unitId": "u_city_b", "startTime": "2026-10-01T10:30:00Z", "endTime": "2026-10-01T11:30:00Z", "location": {"latitude": 26.8467, "longitude": 80.9462}}
            ]
        }
    })

    # Rule 30: Possible Collusion Indicators
    scenarios.append({
        "ruleId": "RULE_30_POSSIBLE_COLLUSION_INDICATORS",
        "category": "INSPECTION",
        "description": "Inspector gives 3 clean reports to unit while independent vigilance audit finds 5 deficiencies",
        "groundTruth": "POSITIVE",
        "payload": {
            "inspectorId": "insp_i30_pos",
            "unitId": "unit_lenient_01",
            "inspectorPairingHistory": [
                {"unitId": "unit_lenient_01", "deficiencyCount": 0, "score": 100},
                {"unitId": "unit_lenient_01", "deficiencyCount": 0, "score": 100},
                {"unitId": "unit_lenient_01", "deficiencyCount": 0, "score": 100}
            ],
            "thirdPartyAuditsToUnit": [
                {"deficiencyCount": 5, "auditor": "National Social Defence Audit"}
            ]
        }
    })

    return scenarios

def run_phase2_benchmark() -> Dict[str, Any]:
    config = load_scheme_profile()
    scenarios = generate_phase2_dataset()

    tp = 0
    fp = 0
    fn = 0
    tn = 0
    results_by_rule: Dict[str, Dict[str, int]] = {}

    for s in scenarios:
        r_id = s["ruleId"]
        gt = s["groundTruth"]
        detector = rule_registry.get_detector(r_id)

        stats = results_by_rule.setdefault(r_id, {"TP": 0, "FP": 0, "FN": 0, "TN": 0, "total": 0})
        stats["total"] += 1

        if not detector:
            if gt == "POSITIVE":
                fn += 1
                stats["FN"] += 1
            else:
                tn += 1
                stats["TN"] += 1
            continue

        findings = detector.detect(s["payload"], config)
        flagged = len(findings) > 0

        if gt == "POSITIVE":
            if flagged:
                tp += 1
                stats["TP"] += 1
            else:
                fn += 1
                stats["FN"] += 1
        elif gt in ("NEGATIVE", "LOOKALIKE_EXCEPTION"):
            if flagged:
                fp += 1
                stats["FP"] += 1
            else:
                tn += 1
                stats["TN"] += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    fdr = fp / (tp + fp) if (tp + fp) > 0 else 0.0

    return {
        "overall": {
            "totalScenarios": len(scenarios),
            "truePositives": tp,
            "falsePositives": fp,
            "falseNegatives": fn,
            "trueNegatives": tn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "falseDiscoveryRate": round(fdr, 4)
        },
        "byRule": results_by_rule
    }

if __name__ == "__main__":
    res = run_phase2_benchmark()
    print("==================================================")
    print("   DoSJE Phase 2 AI Anomaly Engine Benchmark      ")
    print("==================================================")
    print(f"Total Scenarios Evaluated : {res['overall']['totalScenarios']}")
    print(f"True Positives (TP)       : {res['overall']['truePositives']}")
    print(f"False Positives (FP)      : {res['overall']['falsePositives']}")
    print(f"False Negatives (FN)      : {res['overall']['falseNegatives']}")
    print(f"True Negatives (TN)       : {res['overall']['trueNegatives']}")
    print(f"Precision                 : {res['overall']['precision'] * 100:.2f}%")
    print(f"Recall                    : {res['overall']['recall'] * 100:.2f}%")
    print(f"False Discovery Rate (FDR): {res['overall']['falseDiscoveryRate'] * 100:.2f}%")
    print("==================================================")

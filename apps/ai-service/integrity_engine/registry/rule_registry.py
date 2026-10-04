"""
Central Rule Registry for DoSJE Anomaly & Attendance Analysis.
Maintains metadata and detector classes for all 44 rules, wiring Phase 1 and Phase 2 pure detectors.
"""

from typing import Dict, List, Any, Optional
from src.registry.base import RuleMetadata, BaseDetector
from src.schemas.common import RuleType, FindingCategory, Severity, SuggestedAction, StandardFinding

# Import Phase 1 & Phase 2 Pure Detectors
from src.detectors.attendance.attendance_detector import PureAttendanceDetector
from src.detectors.inspection.inspection_detectors import (
    Rule23LocationMismatchDetector,
    Rule24RepeatedlyIncompleteInspectionsDetector,
    Rule25UnusuallyShortInspectionsDetector,
    Rule26EvidenceOutsideVisitDetector,
    Rule27RepeatedFindingsUnresolvedDetector,
    Rule28SuspiciousPostSubmissionEditsDetector,
    Rule29AssignmentConflictsDetector,
    Rule30PossibleCollusionIndicatorsDetector
)
from src.detectors.register.register_detectors import (
    Rule5SimilarRecordsDetector,
    Rule6RepeatedContactDetector,
    Rule2RepeatedFailuresDetector,
    Rule3InactiveBeneficiaryClaimDetector,
    Rule4UnusualDistributionDetector,
    Rule7InconsistentDatesDetector,
    Rule8FrequentTransfersDetector
)
from src.detectors.finance.finance_detectors import (
    Rule16ExpenditurePerBeneficiaryDetector,
    Rule17DuplicateExpenditureClaimDetector,
    Rule18BudgetUtilisationMismatchDetector,
    Rule19SpendingNearDeadlinesDetector,
    Rule20ExpenseOverAuthorisedLimitDetector,
    Rule21SpendingVsProjectProgressDetector,
    Rule22SimilarInvoicesAcrossUnitsDetector
)

class GenericMockDetector(BaseDetector):
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        return []

class RuleRegistry:
    def __init__(self):
        self._detectors: Dict[str, BaseDetector] = {}
        self._metadata: Dict[str, RuleMetadata] = {}
        self._register_all_rules()

    def register(self, metadata: RuleMetadata, detector_cls=GenericMockDetector):
        self._metadata[metadata.ruleId] = metadata
        self._detectors[metadata.ruleId] = detector_cls(metadata)

    def get_detector(self, rule_id: str) -> Optional[BaseDetector]:
        return self._detectors.get(rule_id)

    def get_metadata(self, rule_id: str) -> Optional[RuleMetadata]:
        return self._metadata.get(rule_id)

    def list_all_rules(self) -> List[RuleMetadata]:
        return list(self._metadata.values())

    def _register_all_rules(self):
        # PART 1: ATTENDANCE RULES (Wired with PureAttendanceDetector)
        self.register(RuleMetadata(
            ruleId="RULE_1_VERIFICATION_RATIO_LOW", ruleNumber=1, module="attendance",
            name="Verification Ratio Low", ruleType=RuleType.COMPUTER_VISION,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Verified face count in session is significantly lower than claimed register ticks.",
            requiredInputs=["photos", "tickedParticipantIds"]
        ), PureAttendanceDetector)

        self.register(RuleMetadata(
            ruleId="RULE_1_REPEATED_LOW_RATIO", ruleNumber=1, module="attendance",
            name="Repeated Low Verification Ratio", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Unit has recorded low face verification ratios for consecutive sessions.",
            requiredInputs=["sessionHistory"]
        ), PureAttendanceDetector)

        self.register(RuleMetadata(
            ruleId="RULE_1_OVER_SANCTION", ruleNumber=1, module="attendance",
            name="Over Sanctioned Capacity", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
            description="Attendance count exceeds legally sanctioned unit capacity.",
            requiredInputs=["tickedParticipantIds", "sanctionedStrength"]
        ), PureAttendanceDetector)

        self.register(RuleMetadata(
            ruleId="RULE_1_PHOTO_REUSE", ruleNumber=1, module="attendance",
            name="Duplicate Photo Hash", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Attendance photo matches a previously submitted image hash.",
            requiredInputs=["photos", "historicalPhotoHashes"]
        ), PureAttendanceDetector)

        self.register(RuleMetadata(
            ruleId="RULE_1_OFF_SITE_PHOTO", ruleNumber=1, module="attendance",
            name="Off-Site Geofence Breach", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Attendance photo GPS fix is outside the designated institutional geofence.",
            requiredInputs=["gps", "unitLocation"]
        ), PureAttendanceDetector)

        self.register(RuleMetadata(
            ruleId="RULE_1_LONG_ABSENCE", ruleNumber=1, module="attendance",
            name="Prolonged Unexplained Absence", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
            description="Participant absent for consecutive working days without recorded leave excuse.",
            requiredInputs=["consecutiveAbsentDays"]
        ), PureAttendanceDetector)

        # PART 2: REGISTER INTEGRITY RULES (2 to 8)
        self.register(RuleMetadata(
            ruleId="RULE_2_REPEATED_FAILED_VERIFICATION", ruleNumber=2, module="register",
            name="Repeated Failed Verification", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.REQUEST_DOCUMENTS,
            description="High cluster of document verification failures in a sliding window (excluding technical glitches).",
            requiredInputs=["verifications"]
        ), Rule2RepeatedFailuresDetector)

        self.register(RuleMetadata(
            ruleId="RULE_3_INACTIVE_BENEFICIARY_CLAIM", ruleNumber=3, module="register",
            name="Inactive Beneficiary Receiving Benefits", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
            description="Disbursement claim outside active enrollment windows or after exit/death.",
            requiredInputs=["claims", "enrollments"]
        ), Rule3InactiveBeneficiaryClaimDetector)

        self.register(RuleMetadata(
            ruleId="RULE_4_UNUSUAL_DISTRIBUTION", ruleNumber=4, module="register",
            name="Unusual Beneficiary Distribution", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
            description="Demographic category shift significantly diverging from baseline (Chi-square + TVD).",
            requiredInputs=["beneficiaries", "enrollments"]
        ), Rule4UnusualDistributionDetector)

        self.register(RuleMetadata(
            ruleId="RULE_5_SIMILAR_RECORDS", ruleNumber=5, module="register",
            name="Suspiciously Similar Records", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Candidate blocked fuzzy profile match indicating duplicate registration.",
            requiredInputs=["beneficiaries"]
        ), Rule5SimilarRecordsDetector)

        self.register(RuleMetadata(
            ruleId="RULE_6_REPEATED_CONTACT", ruleNumber=6, module="register",
            name="Repeated Contact Details", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.DATA_CORRECTION,
            description="Same contact phone/bank hash shared across unrelated families.",
            requiredInputs=["beneficiaries"]
        ), Rule6RepeatedContactDetector)

        self.register(RuleMetadata(
            ruleId="RULE_7_INCONSISTENT_DATES", ruleNumber=7, module="register",
            name="Impossible or Inconsistent Dates", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.DATA_QUALITY, defaultSeverity=Severity.LOW,
            suggestedAction=SuggestedAction.DATA_CORRECTION,
            description="Temporal inconsistency in DOB, enrollment interval, or concurrent unit overlap.",
            requiredInputs=["beneficiaries", "enrollments"]
        ), Rule7InconsistentDatesDetector)

        self.register(RuleMetadata(
            ruleId="RULE_8_FREQUENT_TRANSFERS", ruleNumber=8, module="register",
            name="Unusually Frequent Transfers", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.REQUEST_DOCUMENTS,
            description="Excessive mobility, short stays, or ping-pong transfer patterns.",
            requiredInputs=["transfers"]
        ), Rule8FrequentTransfersDetector)

        # PART 3: FINANCE RULES (16 to 22)
        self.register(RuleMetadata(
            ruleId="RULE_16_EXPENDITURE_PER_BENEFICIARY", ruleNumber=16, module="finance",
            name="Expenditure Per Beneficiary Anomaly", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
            description="Variable cost per verified attendee deviates significantly from peer group MAD.",
            requiredInputs=["invoices", "budgetHeads"]
        ), Rule16ExpenditurePerBeneficiaryDetector)

        self.register(RuleMetadata(
            ruleId="RULE_17_DUPLICATE_EXPENDITURE_CLAIM", ruleNumber=17, module="finance",
            name="Duplicate Expenditure Claims", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
            description="Exact or perceptual hash duplicate invoice claimed across units/periods.",
            requiredInputs=["invoices"]
        ), Rule17DuplicateExpenditureClaimDetector)

        self.register(RuleMetadata(
            ruleId="RULE_18_BUDGET_UTILISATION_MISMATCH", ruleNumber=18, module="finance",
            name="Budget Utilisation Arithmetic Mismatch", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.DATA_QUALITY, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.DATA_CORRECTION,
            description="Line item totals conflict with reported balance and sanctioned head limits.",
            requiredInputs=["invoices", "budgetHeads"]
        ), Rule18BudgetUtilisationMismatchDetector)

        self.register(RuleMetadata(
            ruleId="RULE_19_SPENDING_NEAR_DEADLINES", ruleNumber=19, module="finance",
            name="Spending Clustered Near Deadlines", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
            description="Abnormal spending spike right before fiscal deadline relative to fund receipt date.",
            requiredInputs=["invoices"]
        ), Rule19SpendingNearDeadlinesDetector)

        self.register(RuleMetadata(
            ruleId="RULE_20_EXPENSE_OVER_AUTHORISED_LIMIT", ruleNumber=20, module="finance",
            name="Expense Over Authorised Limit", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
            description="Single or split invoices exceeding designated sanction approval ceilings.",
            requiredInputs=["invoices"]
        ), Rule20ExpenseOverAuthorisedLimitDetector)

        self.register(RuleMetadata(
            ruleId="RULE_21_SPENDING_VS_PROJECT_PROGRESS", ruleNumber=21, module="finance",
            name="Spending Disproportionate to Progress", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
            description="Financial claim disproportional to verified physical milestone completion.",
            requiredInputs=["invoices"]
        ), Rule21SpendingVsProjectProgressDetector)

        self.register(RuleMetadata(
            ruleId="RULE_22_SIMILAR_INVOICES_ACROSS_UNITS", ruleNumber=22, module="finance",
            name="Similar Invoices Across Institutions", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.VERIFY_BEFORE_NEXT_INSTALMENT,
            description="Shared vendor attributes, consecutive numbering, and matching line items across separate units.",
            requiredInputs=["invoices"]
        ), Rule22SimilarInvoicesAcrossUnitsDetector)

        # PART 4: INSPECTION RULES (23 to 30)
        self.register(RuleMetadata(
            ruleId="RULE_23_LOCATION_MISMATCH", ruleNumber=23, module="inspection",
            name="Inspection Location Mismatch", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Inspection GPS fixes recorded outside unit geofence radius.",
            requiredInputs=["gpsTelemetry", "unitLocation"]
        ), Rule23LocationMismatchDetector)

        self.register(RuleMetadata(
            ruleId="RULE_24_REPEATEDLY_INCOMPLETE_INSPECTIONS", ruleNumber=24, module="inspection",
            name="Repeatedly Incomplete Inspections", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
            description="Checklist exhibits high N/A rates, filler responses, or low completeness.",
            requiredInputs=["inspectionResponses"]
        ), Rule24RepeatedlyIncompleteInspectionsDetector)

        self.register(RuleMetadata(
            ruleId="RULE_25_UNUSUALLY_SHORT_INSPECTIONS", ruleNumber=25, module="inspection",
            name="Unusually Short Inspection Duration", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
            description="Visit completed significantly faster than checklist duration baseline.",
            requiredInputs=["durationMinutes", "inspectionResponses"]
        ), Rule25UnusuallyShortInspectionsDetector)

        self.register(RuleMetadata(
            ruleId="RULE_26_EVIDENCE_OUTSIDE_VISIT", ruleNumber=26, module="inspection",
            name="Evidence Captured Outside Visit Window", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Photo timestamp or server receive gap inconsistent with official visit window.",
            requiredInputs=["evidencePhotos"]
        ), Rule26EvidenceOutsideVisitDetector)

        self.register(RuleMetadata(
            ruleId="RULE_27_REPEATED_FINDINGS_UNRESOLVED", ruleNumber=27, module="inspection",
            name="Repeated Unresolved Inspection Findings", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.MEDIUM,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Critical inspection finding repeated across visits without remediation.",
            requiredInputs=["currentDeficiencies", "historicalDeficiencies"]
        ), Rule27RepeatedFindingsUnresolvedDetector)

        self.register(RuleMetadata(
            ruleId="RULE_28_SUSPICIOUS_POST_SUBMISSION_EDITS", ruleNumber=28, module="inspection",
            name="Suspicious Post-Submission Edits", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
            description="Material retrospective changes made to finalized inspection records.",
            requiredInputs=["modificationAuditLog"]
        ), Rule28SuspiciousPostSubmissionEditsDetector)

        self.register(RuleMetadata(
            ruleId="RULE_29_ASSIGNMENT_CONFLICTS", ruleNumber=29, module="inspection",
            name="Inspector Schedule & Assignment Conflict", ruleType=RuleType.RULE_BASED,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.REQUEST_CLARIFICATION,
            description="Overlapping inspection timestamps in distant locations defying travel feasibility.",
            requiredInputs=["inspectorScheduleVisits"]
        ), Rule29AssignmentConflictsDetector)

        self.register(RuleMetadata(
            ruleId="RULE_30_POSSIBLE_COLLUSION_INDICATORS", ruleNumber=30, module="inspection",
            name="Possible Collusion & Leniency Bias", ruleType=RuleType.STATISTICAL,
            defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH,
            suggestedAction=SuggestedAction.FIELD_VERIFICATION,
            description="Repeat pairing leniency bias and identical findings across independent signals.",
            requiredInputs=["inspectorPairingHistory"]
        ), Rule30PossibleCollusionIndicatorsDetector)

        # PART 5: BEHAVIORAL & HISTORICAL MONTHLY (37 to 44)
        for r_num, r_id, r_name, r_desc, r_type in [
            (37, "RULE_37_BENEFICIARY_GROWTH", "Unusual Claimed Beneficiary Growth", "Claimed beneficiary surge unsupported by seasonal trend or peer baseline.", RuleType.STATISTICAL),
            (38, "RULE_38_UNUSUAL_ATTENDANCE_TRENDS", "Unusual Attendance Invariance", "Zero statistical fluctuation in attendance across months (copied attendance).", RuleType.STATISTICAL),
            (39, "RULE_39_REPORT_SUBMISSION_BURSTS", "Abnormal Submission Timing Bursts", "Late night clustered timestamp submissions indicating retroactive mass logging.", RuleType.STATISTICAL),
            (40, "RULE_40_REPEATED_DISCREPANCIES", "High Cumulative Risk Review Score", "Composite indicator index ranking unit in highest risk percentile.", RuleType.STATISTICAL),
            (41, "RULE_41_CLUSTERS_OF_SIMILAR_NEW_RECORDS", "New Record Similarity Cluster", "Graph cluster of new enrollments with shared attributes.", RuleType.STATISTICAL),
            (42, "RULE_42_CHANGES_AFTER_NOTIFICATIONS", "Spike in Edits Post Official Notice", "Material retroactive modifications concentrated immediately following audit notices.", RuleType.STATISTICAL),
            (43, "RULE_43_RECURRING_ANOMALIES", "Chronic Recurring Discrepancies", "Persistent cross-period recurrence of verified fraud signals.", RuleType.STATISTICAL),
            (44, "RULE_44_CROSS_MODULE_TRIANGULATION", "Cross-Module Triangulation Conflict", "Multi-source contradiction (e.g. food expenditure rising while attendance dropping).", RuleType.ML)
        ]:
            self.register(RuleMetadata(
                ruleId=r_id, ruleNumber=r_num, module="behavioral", name=r_name,
                ruleType=r_type, defaultCategory=FindingCategory.RISK_INDICATOR, defaultSeverity=Severity.HIGH if r_num in (40, 43, 44) else Severity.MEDIUM,
                suggestedAction=SuggestedAction.FIELD_VERIFICATION, description=r_desc,
                requiredInputs=["monthlyMetrics"]
            ), GenericMockDetector)

rule_registry = RuleRegistry()

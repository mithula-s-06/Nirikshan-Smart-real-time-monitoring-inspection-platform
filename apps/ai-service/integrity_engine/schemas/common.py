import hashlib
from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

class FindingCategory(str, Enum):
    RISK_INDICATOR = "risk_indicator"
    DATA_QUALITY = "data_quality"

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class RuleType(str, Enum):
    RULE_BASED = "rule_based"
    STATISTICAL = "statistical"
    ML = "ml"
    COMPUTER_VISION = "computer_vision"

class EntityType(str, Enum):
    BENEFICIARY = "beneficiary"
    SESSION = "session"
    UNIT = "unit"
    OPERATOR = "operator"
    INSPECTOR = "inspector"
    VENDOR = "vendor"
    INVOICE = "invoice"
    INSPECTION = "inspection"
    PAIR = "pair"
    STAFF = "staff"

class SuggestedAction(str, Enum):
    REQUEST_DOCUMENTS = "request_documents"
    REQUEST_CLARIFICATION = "request_clarification"
    FIELD_VERIFICATION = "field_verification"
    VERIFY_BEFORE_NEXT_INSTALMENT = "verify_before_next_instalment"
    DATA_CORRECTION = "data_correction"
    MONITOR_NEXT_PERIOD = "monitor_next_period"

class StandardFinding(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    module: str
    ruleId: str = Field(..., alias="ruleId")
    ruleType: RuleType = Field(default=RuleType.RULE_BASED, alias="ruleType")
    category: FindingCategory = Field(default=FindingCategory.RISK_INDICATOR)
    entityType: EntityType = Field(..., alias="entityType")
    entityId: str = Field(..., alias="entityId")
    period: str
    severity: Severity = Field(default=Severity.MEDIUM)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    reason: str
    details: Dict[str, Any] = Field(default_factory=dict)
    amountAtRisk: Optional[float] = Field(default=None, alias="amountAtRisk")
    evidenceRefs: List[str] = Field(default_factory=list, alias="evidenceRefs")
    suggestedAction: SuggestedAction = Field(default=SuggestedAction.REQUEST_CLARIFICATION, alias="suggestedAction")
    configVersion: str = Field(default="2026.10.v1", alias="configVersion")
    modelVersion: Optional[str] = Field(default=None, alias="modelVersion")
    fingerprint: str = ""
    detectedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z", alias="detectedAt")

    def compute_fingerprint(self) -> str:
        """Computes deterministic 32-character SHA-256 fingerprint."""
        refs_str = "::".join(sorted(self.evidenceRefs))
        raw = f"{self.ruleId}::{self.entityType.value}::{self.entityId}::{self.period}::{refs_str}"
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()[:32]

    def model_post_init(self, __context: Any) -> None:
        if not self.fingerprint:
            self.fingerprint = self.compute_fingerprint()

class ModuleAnalysisSummary(BaseModel):
    module: str
    rulesExecuted: List[str]
    totalFindings: int
    riskIndicatorsCount: int
    dataQualityCount: int
    highSeverityCount: int
    mediumSeverityCount: int
    lowSeverityCount: int
    totalAmountAtRisk: float
    executionTimeMs: float
    configVersion: str

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from src.schemas.common import StandardFinding, RuleType, FindingCategory, Severity, SuggestedAction

class RuleMetadata(BaseModel):
    ruleId: str
    ruleNumber: int
    module: str
    name: str
    ruleType: RuleType
    defaultCategory: FindingCategory
    defaultSeverity: Severity
    suggestedAction: SuggestedAction
    description: str
    requiredInputs: List[str]
    isPhase0Ready: bool = True

class BaseDetector(ABC):
    """
    Abstract Pure Detector Contract.
    Must be stateless, typed, pure, and return an empty list or 'insufficient data' finding when inputs are missing.
    """
    def __init__(self, metadata: RuleMetadata):
        self.metadata = metadata

    @abstractmethod
    def detect(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        """Executes pure rule logic on the payload."""
        pass

    def generate_mock_findings(self, payload: Dict[str, Any], config: Dict[str, Any]) -> List[StandardFinding]:
        """Generates realistic sample findings for mock mode."""
        entity_id = payload.get("unitId") or payload.get("sessionId") or payload.get("inspectionId") or payload.get("beneficiaryId") or "entity_sample_01"
        period = payload.get("date") or payload.get("month") or payload.get("visitDate") or "2026-10"
        return [
            StandardFinding(
                module=self.metadata.module,
                ruleId=self.metadata.ruleId,
                ruleType=self.metadata.ruleType,
                category=self.metadata.defaultCategory,
                entityType="unit" if "unit" in str(entity_id).lower() else "beneficiary",
                entityId=str(entity_id),
                period=str(period),
                severity=self.metadata.defaultSeverity,
                confidence=0.88,
                reason=f"[MOCK SAMPLE] {self.metadata.description}",
                details={"simulated": True, "rule": self.metadata.name},
                amountAtRisk=3500.0 if self.metadata.module == "finance" or "claim" in self.metadata.ruleId.lower() else None,
                evidenceRefs=[f"mock_ref_{self.metadata.ruleNumber}_01"],
                suggestedAction=self.metadata.suggestedAction,
                configVersion=config.get("version", "2026.10.v1"),
                modelVersion="mock_engine_v1"
            )
        ]

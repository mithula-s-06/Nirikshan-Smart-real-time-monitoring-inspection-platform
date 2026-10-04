"""
Findings Engine: Deduplication, Calendar Dampening, and Database Persistence.
Ensures:
- Deterministic 32-character SHA-256 fingerprinting (ruleId::entityType::entityId::period::evidenceRefs)
- Calendar event suppression and dampening
- Idempotent database storage into FindingsHistory
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.schemas.common import StandardFinding, FindingCategory, Severity
from src.core.database import FindingsHistory, SessionLocal
from src.core.calendar import get_calendar_events_for_date

class FindingsEngine:
    @staticmethod
    def process_and_persist_findings(
        findings: List[StandardFinding],
        db: Optional[Session] = None,
        district: Optional[str] = None,
        state: Optional[str] = None,
        scheme_id: Optional[str] = None
    ) -> List[StandardFinding]:
        """
        Deduplicates, dampens via calendar, and idempotently persists findings to the database.
        """
        if not findings:
            return []

        own_session = False
        if db is None:
            db = SessionLocal()
            own_session = True

        processed_findings = []
        try:
            for f in findings:
                # 1. Calendar dampening check
                if len(f.period) >= 10:
                    period_date = f.period[:10]
                elif len(f.period) == 7:
                    period_date = f"{f.period}-01"
                else:
                    period_date = datetime.utcnow().strftime("%Y-%m-%d")

                events = get_calendar_events_for_date(period_date, district=district, state=state, scheme_id=scheme_id)
                
                is_suppressed = False
                for evt in events:
                    # If rule matches suppressed rule types
                    rule_suppression = evt.get("suppressRuleTypes") or evt.get("suppressRules") or []
                    if f.ruleId in rule_suppression or f.ruleType.value in rule_suppression:
                        is_suppressed = True
                        break
                    # If intake event dampens statistical distribution rules
                    if evt.get("eventType") == "NEW_INTAKE_CYCLE" and f.ruleId == "RULE_4_UNUSUAL_DISTRIBUTION":
                        is_suppressed = True
                        break
                
                if is_suppressed:
                    continue

                # 2. Database idempotency check & persist
                existing = db.query(FindingsHistory).filter(FindingsHistory.fingerprint == f.fingerprint).first()
                if existing:
                    # Update timestamp / details if active
                    existing.detected_at = datetime.utcnow()
                    existing.confidence = f.confidence
                    if f.details:
                        existing.details = f.details
                else:
                    new_record = FindingsHistory(
                        fingerprint=f.fingerprint,
                        rule_id=f.ruleId,
                        module=f.module,
                        category=f.category.value,
                        entity_type=f.entityType,
                        entity_id=f.entityId,
                        period=f.period,
                        severity=f.severity.value,
                        confidence=f.confidence,
                        reason=f.reason,
                        details=f.details,
                        amount_at_risk=f.amountAtRisk,
                        evidence_refs=f.evidenceRefs,
                        suggested_action=f.suggestedAction.value,
                        config_version=f.configVersion,
                        model_version=f.modelVersion,
                        detected_at=datetime.utcnow(),
                        reviewed=False,
                        resolution_status="ACTIVE"
                    )
                    db.add(new_record)
                
                processed_findings.append(f)

            db.commit()
        except Exception as e:
            db.rollback()
            # If DB write fails, still return memory findings
            print(f"Warning: Findings persistence failed: {e}")
            return findings
        finally:
            if own_session:
                db.close()

        return processed_findings

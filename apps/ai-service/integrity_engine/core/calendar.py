import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from src.core.config import settings

_CALENDAR_EVENTS: List[Dict[str, Any]] = []

def load_calendar_events() -> List[Dict[str, Any]]:
    """Loads events and exception annotations from calendar file."""
    global _CALENDAR_EVENTS
    if not _CALENDAR_EVENTS:
        if settings.CALENDAR_FILE.exists():
            with open(settings.CALENDAR_FILE, "r", encoding="utf-8") as f:
                _CALENDAR_EVENTS = json.load(f)
        else:
            _CALENDAR_EVENTS = []
    return _CALENDAR_EVENTS

def get_applicable_events(
    date_str: str,
    unit_id: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    scheme_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Finds all active sanctioned events that cover the specified date and scope.
    """
    events = load_calendar_events()
    matched = []
    try:
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
    except Exception:
        return []

    for ev in events:
        try:
            start_dt = datetime.strptime(ev["startDate"], "%Y-%m-%d")
            end_dt = datetime.strptime(ev["endDate"], "%Y-%m-%d")
        except Exception:
            continue

        if start_dt <= dt <= end_dt:
            scope = ev.get("scope", "ALL").upper()
            if scope == "ALL":
                matched.append(ev)
            elif scope == "UNIT" and unit_id and ev.get("unitId") == unit_id:
                matched.append(ev)
            elif scope == "DISTRICT" and district and ev.get("district") == district:
                matched.append(ev)
            elif scope == "STATE" and state and ev.get("state") == state:
                matched.append(ev)
            elif scope == "SCHEME" and scheme_id and ev.get("schemeId") == scheme_id:
                matched.append(ev)

    return matched

# Convenient alias
get_calendar_events_for_date = get_applicable_events

def is_rule_suppressed(
    rule_id: str,
    date_str: str,
    unit_id: Optional[str] = None,
    district: Optional[str] = None
) -> Tuple[bool, Optional[str]]:
    """
    Checks if an active sanctioned event suppresses the given rule.
    Returns (is_suppressed, reason).
    """
    events = get_applicable_events(date_str, unit_id, district)
    for ev in events:
        if rule_id in ev.get("suppressRules", []):
            return True, f"Suppressed due to sanctioned event: {ev.get('title')} ({ev.get('eventType')})"
    return False, None

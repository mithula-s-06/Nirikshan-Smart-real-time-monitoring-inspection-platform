from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from src.core.security import verify_api_key
from src.core.scheme_profile import load_scheme_profile
from src.core.calendar import load_calendar_events, get_applicable_events
from src.registry.rule_registry import rule_registry
from src.synthetic.generator import generate_synthetic_dataset, export_synthetic_data_files

router = APIRouter(prefix="/config", tags=["Configuration, Calendar & Rule Registry"])

@router.get("/profile", response_model=Dict[str, Any])
async def get_scheme_profile(
    version: Optional[str] = Query(None),
    api_key: str = Depends(verify_api_key)
):
    """Returns active versioned scheme profile configuration."""
    return load_scheme_profile(version)

@router.get("/calendar", response_model=List[Dict[str, Any]])
async def get_calendar(
    date: Optional[str] = Query(None),
    unit_id: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    api_key: str = Depends(verify_api_key)
):
    """Returns active calendar exception events, intake cycles, and advisories."""
    if date:
        return get_applicable_events(date, unit_id, district)
    return load_calendar_events()

@router.get("/rules", response_model=List[Dict[str, Any]])
async def list_rules(
    module: Optional[str] = Query(None),
    api_key: str = Depends(verify_api_key)
):
    """Lists all rules in the registry with honest ruleType classification and input specs."""
    rules = rule_registry.list_all_rules()
    if module:
        rules = [r for r in rules if r.module.lower() == module.lower()]
    return [r.model_dump() for r in rules]

@router.get("/synthetic/benchmark", response_model=Dict[str, Any])
async def get_synthetic_benchmark(
    api_key: str = Depends(verify_api_key)
):
    """Generates and returns fresh synthetic ground-truth benchmark data."""
    return generate_synthetic_dataset()

@router.post("/synthetic/export", response_model=Dict[str, str])
async def export_synthetic_benchmark(
    api_key: str = Depends(verify_api_key)
):
    """Exports synthetic benchmarks to CSV & JSON for partner team database seeding."""
    path_str = export_synthetic_data_files()
    return {"status": "SUCCESS", "exportDirectory": path_str}

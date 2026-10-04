import json
from pathlib import Path
from typing import Dict, Any, Optional
from src.core.config import settings

_PROFILES_CACHE: Dict[str, Dict[str, Any]] = {}

def load_scheme_profile(version_or_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Loads scheme profile configuration by version or path.
    Falls back to default_scheme_profile.json if not specified.
    """
    global _PROFILES_CACHE
    if not _PROFILES_CACHE:
        default_file = settings.DEFAULT_PROFILE_FILE
        if default_file.exists():
            with open(default_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                _PROFILES_CACHE[data.get("version", "default")] = data
                _PROFILES_CACHE["default"] = data
        else:
            _PROFILES_CACHE["default"] = {
                "version": "2026.10.v1",
                "profileId": "DEFAULT_FALLBACK",
                "attendance": { "quality": { "minBlurLaplacianVariance": 50.0 } },
                "registerIntegrity": { "rule2_repeatedFailures": { "windowDays": 60, "minFailures": 3 } }
            }

    if version_or_path and version_or_path in _PROFILES_CACHE:
        return _PROFILES_CACHE[version_or_path]
    
    # Try reading as file path
    if version_or_path:
        p = Path(version_or_path)
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
                _PROFILES_CACHE[data.get("version", str(p))] = data
                return data

    return _PROFILES_CACHE["default"]

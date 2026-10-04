import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field

# When running from inside apps/ai-service/integrity_engine/core/config.py:
#   parent       = core/
#   parent.parent = integrity_engine/
#   parent.parent.parent = apps/ai-service/   ← this is our base
_INTEGRITY_ENGINE_DIR = Path(__file__).resolve().parent.parent   # integrity_engine/
BASE_DIR = _INTEGRITY_ENGINE_DIR.parent                          # apps/ai-service/

class Settings(BaseSettings):
    PROJECT_NAME: str = "DoSJE Anomaly & Attendance Analysis Engine"
    API_V1_STR: str = "/v1"
    SHARED_API_KEY: str = Field(default="dosje-secret-key-2026", validation_alias="API_SECRET_KEY")
    DATABASE_URL: str = Field(
        default=f"sqlite:///{BASE_DIR}/analytics_store.db",
        validation_alias="DATABASE_URL"
    )
    CONFIG_DIR: Path = _INTEGRITY_ENGINE_DIR / "config"
    MODELS_DIR: Path = BASE_DIR / "models"
    DEFAULT_PROFILE_FILE: Path = _INTEGRITY_ENGINE_DIR / "config" / "default_scheme_profile.json"
    CALENDAR_FILE: Path = _INTEGRITY_ENGINE_DIR / "config" / "annotation_calendar.json"
    MOCK_MODE_DEFAULT: bool = False

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()


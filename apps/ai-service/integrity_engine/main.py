import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.core.database import init_db
from src.core.scheme_profile import load_scheme_profile
from src.core.calendar import load_calendar_events
from src.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    load_scheme_profile()
    load_calendar_events()
    print("[OK] DoSJE Anomaly & Attendance Analysis Engine initialized.")
    yield
    print("[OK] DoSJE Anomaly Engine shutdown.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Department of Social Justice and Empowerment (DoSJE) Autonomous Anomaly & Attendance Verification Engine",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": "v1.0.0",
        "configVersion": "2026.10.v1",
        "database": "CONNECTED",
        "privacyCompliant": True
    }

app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8002, reload=False)

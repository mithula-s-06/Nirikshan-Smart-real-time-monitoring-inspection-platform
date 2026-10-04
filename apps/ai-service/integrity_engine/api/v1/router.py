from fastapi import APIRouter
from src.api.v1.attendance import router as attendance_router
from src.api.v1.integrity import router as integrity_router
from src.api.v1.finance import router as finance_router
from src.api.v1.inspection import router as inspection_router
from src.api.v1.monthly import router as monthly_router
from src.api.v1.metrics import router as metrics_router
from src.api.v1.config import router as config_router

api_router = APIRouter()
api_router.include_router(attendance_router)
api_router.include_router(integrity_router)
api_router.include_router(finance_router)
api_router.include_router(inspection_router)
api_router.include_router(monthly_router)
api_router.include_router(metrics_router)
api_router.include_router(config_router)

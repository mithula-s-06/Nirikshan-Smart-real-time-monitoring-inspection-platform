from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, JSON, Boolean, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from src.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class FindingsHistory(Base):
    __tablename__ = "findings_history"

    fingerprint = Column(String(64), primary_key=True, index=True)
    rule_id = Column(String(64), index=True, nullable=False)
    module = Column(String(32), index=True, nullable=False)
    category = Column(String(32), nullable=False)
    entity_type = Column(String(32), nullable=False)
    entity_id = Column(String(128), index=True, nullable=False)
    period = Column(String(32), index=True, nullable=False)
    severity = Column(String(16), nullable=False)
    confidence = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    amount_at_risk = Column(Float, nullable=True)
    evidence_refs = Column(JSON, nullable=True)
    suggested_action = Column(String(64), nullable=False)
    config_version = Column(String(32), nullable=False)
    model_version = Column(String(32), nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed = Column(Boolean, default=False)
    resolution_status = Column(String(32), default="ACTIVE")

class MonthlyUnitMetrics(Base):
    __tablename__ = "monthly_unit_metrics"

    id = Column(String(128), primary_key=True) # unit_id::month
    unit_id = Column(String(64), index=True, nullable=False)
    month = Column(String(16), index=True, nullable=False) # YYYY-MM
    peer_group = Column(String(64), index=True, nullable=True)
    scheme_id = Column(String(64), nullable=True)
    
    # Aggregated Features
    claimed_beneficiaries = Column(Integer, default=0)
    verified_beneficiaries = Column(Integer, default=0)
    avg_verification_ratio = Column(Float, default=0.0)
    attendance_variance = Column(Float, default=0.0)
    consecutive_identical_runs = Column(Integer, default=0)
    long_absence_ratio = Column(Float, default=0.0)
    monthly_expenditure = Column(Float, default=0.0)
    expenditure_per_beneficiary = Column(Float, default=0.0)
    inspection_score = Column(Float, default=1.0)
    
    # ML & Composite Risk
    outlier_score = Column(Float, default=0.0)
    risk_review_score = Column(Float, default=0.0) # 0 to 100
    risk_band = Column(String(16), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    feature_contributions = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    model_id = Column(String(64), primary_key=True)
    model_name = Column(String(64), nullable=False)
    version = Column(String(32), nullable=False)
    algorithm = Column(String(64), nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow)
    parameters = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)
    active = Column(Boolean, default=True)

def init_db():
    """Initializes tables on startup."""
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

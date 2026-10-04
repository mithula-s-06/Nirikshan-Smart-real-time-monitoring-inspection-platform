from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.schemas.common import StandardFinding, ModuleAnalysisSummary

class ChecklistItem(BaseModel):
    itemId: str
    category: Optional[str] = "General"
    response: Optional[str] = "Satisfactory" # Satisfactory, Deficient, NA, etc.
    value: Optional[str] = None
    isNA: Optional[bool] = False
    isMandatory: Optional[bool] = False
    notes: Optional[str] = None
    answeredDurationSeconds: Optional[float] = 15.0

class GpsFix(BaseModel):
    timestamp: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: float = 10.0
    accuracyMeters: Optional[float] = None
    isMock: Optional[bool] = False
    isMockLocation: Optional[bool] = False

class PhotoProof(BaseModel):
    photoId: Optional[str] = None
    sha256: str
    pHash: Optional[str] = None
    captureTime: Optional[str] = None
    capturedAt: Optional[str] = None
    serverReceiveTime: Optional[str] = None
    gps: Optional[GpsFix] = None

class InspectionAnalysisRequest(BaseModel):
    inspectionId: str
    inspectorId: str
    unitId: str
    visitDate: str
    visitStartTime: Optional[str] = None
    visitEndTime: Optional[str] = None
    durationMinutes: Optional[float] = 35.0
    scheduledChecklistCount: int = 25
    checklistResponses: List[ChecklistItem] = Field(default_factory=list)
    gpsTelemetry: Optional[Any] = Field(default_factory=list)
    photoEvidence: List[PhotoProof] = Field(default_factory=list)
    evidencePhotos: List[PhotoProof] = Field(default_factory=list)
    unitLocation: Optional[Dict[str, Any]] = None
    currentDeficiencies: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    historicalDeficiencies: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    modificationAuditLog: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    inspectorScheduleVisits: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    inspectorPairingHistory: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    inspectorCommentsHistory: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    configVersion: Optional[str] = "2026.10.v1"

class InspectionAnalysisMetrics(BaseModel):
    completenessScore: float
    durationMinutes: float
    geofenceAdherence: bool
    evidenceIntegrityScore: float
    naRatio: float

class InspectionAnalysisResponse(BaseModel):
    inspectionId: str
    metrics: InspectionAnalysisMetrics
    summary: ModuleAnalysisSummary
    findings: List[StandardFinding] = Field(default_factory=list)

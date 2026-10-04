from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.schemas.common import StandardFinding

class GpsCoordinates(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = 10.0
    is_mock: Optional[bool] = False

class PhotoQuality(BaseModel):
    blurScore: float
    brightness: float
    width: int
    height: int
    isAcceptable: bool
    rejectionReason: Optional[str] = None

class DetectedFace(BaseModel):
    bbox: List[float] # [x1, y1, x2, y2]
    score: float

class PhotoAnalysisResponse(BaseModel):
    photoId: str
    sha256: str
    pHash: str
    serverReceivedAt: str
    quality: PhotoQuality
    faceCount: int
    faces: List[DetectedFace]
    findings: List[StandardFinding] = Field(default_factory=list)

class SessionPhotoItem(BaseModel):
    photoId: str
    sha256: str
    pHash: str
    timestamp: str
    gps: Optional[GpsCoordinates] = None
    faces: Optional[List[DetectedFace]] = Field(default_factory=list)

class SessionFinalizeRequest(BaseModel):
    sessionId: str
    unitId: str
    sessionType: str = "Morning Rollcall"
    date: str
    sanctionedStrength: int = 30
    activeBeneficiariesCount: int = 30
    tickedParticipantIds: List[str]
    photos: List[SessionPhotoItem] = Field(default_factory=list)
    faceEmbeddingsPerPhoto: Optional[List[List[List[float]]]] = Field(default_factory=list)
    configVersion: Optional[str] = "2026.10.v1"

class SessionMetrics(BaseModel):
    uniqueVerifiedFaces: int
    tickedCount: int
    verificationRatio: float
    attendanceRate: float
    occupancyVsSanction: float
    confidenceScore: float

class SessionFinalizeResponse(BaseModel):
    sessionId: str
    unitId: str
    date: str
    metrics: SessionMetrics
    findings: List[StandardFinding] = Field(default_factory=list)
    configVersion: str

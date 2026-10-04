from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.schemas.common import StandardFinding, ModuleAnalysisSummary

class BeneficiaryRecord(BaseModel):
    id: str
    name: str
    date_of_birth: Optional[str] = Field(default=None, alias="dob")
    guardian: Optional[str] = Field(default=None, alias="guardian_name")
    address: Optional[str] = None
    district: Optional[str] = None
    phone: Optional[str] = None
    category: Optional[str] = "General"
    bank_account_hash: Optional[str] = None

class EnrollmentRecord(BaseModel):
    id: str
    beneficiary_id: str = Field(..., alias="beneficiaryId")
    unit_id: str = Field(..., alias="unitId")
    start_date: str = Field(..., alias="startDate")
    end_date: Optional[str] = Field(default=None, alias="endDate")
    exit_reason: Optional[str] = Field(default=None, alias="exitReason")

class VerificationRecord(BaseModel):
    id: str
    beneficiary_id: str = Field(..., alias="beneficiaryId")
    type: str
    outcome: str # pass or fail
    reason_code: Optional[str] = Field(default=None, alias="reasonCode")
    date: str
    document_number_hash: Optional[str] = Field(default=None, alias="documentNumberHash")
    operator_id: Optional[str] = Field(default=None, alias="operatorId")

class ClaimRecord(BaseModel):
    id: str
    beneficiary_id: str = Field(..., alias="beneficiaryId")
    unit_id: Optional[str] = Field(default=None, alias="unitId")
    period_start: str = Field(..., alias="periodStart")
    period_end: str = Field(..., alias="periodEnd")
    amount: float
    status: Optional[str] = "PROCESSED"

class TransferRecord(BaseModel):
    id: str
    beneficiary_id: str = Field(..., alias="beneficiaryId")
    from_unit_id: str = Field(..., alias="fromUnitId")
    to_unit_id: str = Field(..., alias="toUnitId")
    date: str
    reason: Optional[str] = None

class BeneficiaryIntegrityRequest(BaseModel):
    beneficiaries: Optional[List[BeneficiaryRecord]] = Field(default_factory=list)
    enrollments: Optional[List[EnrollmentRecord]] = Field(default_factory=list)
    verifications: Optional[List[VerificationRecord]] = Field(default_factory=list)
    claims: Optional[List[ClaimRecord]] = Field(default_factory=list)
    transfers: Optional[List[TransferRecord]] = Field(default_factory=list)
    units: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    configVersion: Optional[str] = "2026.10.v1"
    configOverride: Optional[Dict[str, Any]] = None

class BeneficiaryIntegrityResponse(BaseModel):
    summary: ModuleAnalysisSummary
    findings: List[StandardFinding] = Field(default_factory=list)

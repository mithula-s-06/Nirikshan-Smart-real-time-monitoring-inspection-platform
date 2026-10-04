from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.schemas.common import StandardFinding, ModuleAnalysisSummary

class BudgetHead(BaseModel):
    head: Optional[str] = "General"
    headName: Optional[str] = None
    sanctionedAmount: float
    utilisedAmount: float
    instalmentNumber: Optional[int] = 1
    disbursedDate: Optional[str] = None
    hasReappropriationApproval: Optional[bool] = False
    lineItems: Optional[List[Dict[str, Any]]] = None

class InvoiceRecord(BaseModel):
    id: Optional[str] = None
    invoiceNo: Optional[str] = None
    invoiceNumber: Optional[str] = None
    vendorId: Optional[str] = None
    vendorName: Optional[str] = None
    gstin: Optional[str] = None
    vendorGstin: Optional[str] = None
    date: str
    head: Optional[str] = "General"
    amount: float
    isCapital: Optional[bool] = False
    docHash: Optional[str] = None
    documentSha256: Optional[str] = None
    documentPHash: Optional[str] = None
    hasPriorSanctionApproval: Optional[bool] = False
    lineItemsSummary: Optional[str] = None

class FinanceAnalysisRequest(BaseModel):
    unitId: str
    financialYear: str = "2026-2027"
    verifiedBeneficiariesCount: Optional[int] = 25
    monthlyExpenditure: Optional[float] = None
    peerGroupCosts: Optional[List[float]] = Field(default_factory=list)
    openingBalance: Optional[float] = None
    disbursals: Optional[float] = None
    totalExpenditure: Optional[float] = None
    closingBalance: Optional[float] = None
    fiscalYearDeadline: Optional[str] = "2027-03-31"
    fundDisbursalDate: Optional[str] = None
    totalSanctionedGrant: Optional[float] = None
    totalDisbursedFunds: Optional[float] = None
    verifiedPhysicalProgressPercent: Optional[float] = None
    crossUnitInvoices: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    budgetHeads: List[BudgetHead] = Field(default_factory=list)
    invoices: List[InvoiceRecord] = Field(default_factory=list)
    configVersion: Optional[str] = "2026.10.v1"

class FinanceAnalysisResponse(BaseModel):
    summary: ModuleAnalysisSummary
    findings: List[StandardFinding] = Field(default_factory=list)

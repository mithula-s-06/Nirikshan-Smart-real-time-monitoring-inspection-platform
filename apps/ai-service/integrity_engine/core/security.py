import hmac
import hashlib
import re
from typing import Optional
from fastapi import Header, HTTPException, status
from src.core.config import settings

def verify_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> str:
    """
    Validates shared secret API header.
    In development/mocking, if no secret is configured, accepts default.
    """
    expected = settings.SHARED_API_KEY
    if not x_api_key or x_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key authentication header."
        )
    return x_api_key

def hmac_hash(value: str, salt: str = "dosje-salt-2026") -> str:
    """Computes deterministic 16-character HMAC-SHA256 hash for privacy."""
    if not value:
        return ""
    normalized = str(value).strip().lower()
    return hmac.new(salt.encode('utf-8'), normalized.encode('utf-8'), hashlib.sha256).hexdigest()[:16]

def mask_phone(raw_phone: Optional[str]) -> Optional[str]:
    """Masks 10-digit phone number as 98******12."""
    if not raw_phone:
        return None
    cleaned = re.sub(r'\D', '', str(raw_phone))
    if len(cleaned) == 12 and cleaned.startswith('91'):
        cleaned = cleaned[2:]
    elif len(cleaned) == 11 and cleaned.startswith('0'):
        cleaned = cleaned[1:]
    
    if len(cleaned) == 10:
        return f"{cleaned[:2]}******{cleaned[-2:]}"
    elif len(cleaned) >= 4:
        return f"{cleaned[:2]}***{cleaned[-2:]}"
    return "******"

def mask_bank_account(raw_acc: Optional[str]) -> Optional[str]:
    """Masks bank account number as ****5678."""
    if not raw_acc:
        return None
    cleaned = str(raw_acc).strip()
    if len(cleaned) >= 4:
        return f"****{cleaned[-4:]}"
    return "****"

def sanitize_privacy_fields(data_dict: dict, salt: str = "dosje-salt-2026") -> dict:
    """
    Ensures Aadhaar numbers are never stored and sensitive fields are masked & hashed.
    """
    sanitized = {}
    for k, v in data_dict.items():
        if k in ("aadhaar", "aadhaar_number", "aadhaarNo", "uidai"):
            # Never keep Aadhaar numbers
            sanitized[k] = "[REDACTED_PRIVACY_COMPLIANT]"
        elif k in ("phone", "mobile", "contact"):
            sanitized[k] = mask_phone(v)
            sanitized[f"{k}_hash"] = hmac_hash(str(v), salt)
        elif k in ("bank_account", "account_number", "accountNo"):
            sanitized[k] = mask_bank_account(v)
            sanitized[f"{k}_hash"] = hmac_hash(str(v), salt)
        else:
            sanitized[k] = v
    return sanitized

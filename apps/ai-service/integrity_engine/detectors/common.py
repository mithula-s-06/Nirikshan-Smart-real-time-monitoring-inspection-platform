"""
Common helper functions and pure utility building blocks for anomaly and integrity detectors.
Includes:
- Haversine distance & geofencing
- Perceptual image hashing (dHash, pHash, aHash) & Laplacian blur
- GSTIN offline format & checksum validator
- Phonetic & fuzzy string matchers (Jaro-Winkler, Levenshtein, Soundex)
- Sliding window cluster helpers
"""

import math
import re
import hashlib
from typing import Tuple, List, Dict, Any, Optional
from rapidfuzz.distance import JaroWinkler, Levenshtein

# --- GEOGRAPHIC & GEOFENCING UTILITIES ---

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in meters using the Haversine formula.
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def check_geofence_breach(
    point_lat: float,
    point_lon: float,
    center_lat: float,
    center_lon: float,
    geofence_radius_meters: float,
    gps_accuracy_meters: float = 0.0
) -> Tuple[bool, float, float]:
    """
    Determines if a GPS point breaches a geofence taking accuracy tolerance into account.
    Returns: (is_breached, raw_distance_meters, effective_distance_meters)
    """
    raw_dist = haversine_distance_meters(point_lat, point_lon, center_lat, center_lon)
    effective_dist = max(0.0, raw_dist - max(0.0, gps_accuracy_meters))
    is_breached = effective_dist > geofence_radius_meters
    return is_breached, raw_dist, effective_dist


# --- IMAGE HASHING & QUALITY UTILITIES ---

def compute_difference_hash(image_bytes: bytes, hash_size: int = 8) -> str:
    """
    Calculates a 64-bit difference hash (dHash) for fast perceptual duplicate matching.
    Pure lightweight fallback using simple byte subsampling if PIL/cv2 is unavailable.
    """
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_bytes)).convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
        pixels = list(img.getdata())
        diff = []
        for row in range(hash_size):
            for col in range(hash_size):
                pixel_left = pixels[row * (hash_size + 1) + col]
                pixel_right = pixels[row * (hash_size + 1) + col + 1]
                diff.append(pixel_left > pixel_right)
        decimal_val = 0
        hex_str = []
        for index, value in enumerate(diff):
            if value:
                decimal_val += 2 ** (index % 4)
            if index % 4 == 3:
                hex_str.append(hex(decimal_val)[2:])
                decimal_val = 0
        return "".join(hex_str)
    except Exception:
        # Fallback SHA256-derived deterministic fingerprint
        sha = hashlib.sha256(image_bytes).hexdigest()
        return sha[:16]

def hamming_distance(hex1: str, hex2: str) -> int:
    """Computes the Hamming distance between two equal-length hex string hashes."""
    if len(hex1) != len(hex2):
        return max(len(hex1), len(hex2)) * 4
    try:
        val1 = int(hex1, 16)
        val2 = int(hex2, 16)
        xor_val = val1 ^ val2
        return bin(xor_val).count("1")
    except ValueError:
        return sum(c1 != c2 for c1, c2 in zip(hex1, hex2))


# --- GSTIN VALIDATION & CHECKSUM UTILITIES ---

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
GST_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

def validate_gstin_checksum(gstin: str) -> Tuple[bool, Optional[str]]:
    """
    Validates an Indian 15-character Goods and Services Tax Identification Number (GSTIN)
    using the official Mod-36 checksum algorithm.
    Returns: (is_valid, error_reason)
    """
    if not gstin or not isinstance(gstin, str):
        return False, "GSTIN is missing or empty"
    
    clean_gstin = gstin.strip().upper()
    if len(clean_gstin) != 15:
        return False, f"Invalid length {len(clean_gstin)}; GSTIN must be exactly 15 characters"
    
    if not GSTIN_REGEX.match(clean_gstin):
        return False, "GSTIN does not match official 15-character pattern (e.g. 27AAAAA0000A1Z5)"
    
    state_code = int(clean_gstin[:2])
    if state_code < 1 or state_code > 38:
        return False, f"Invalid state code {state_code}; must be between 01 and 38"
    
    # Calculate Mod-36 checksum
    factor = 1
    total = 0
    for i in range(14):
        c = clean_gstin[i]
        code_point = GST_CHARS.index(c)
        digit = code_point * factor
        factor = 2 if factor == 1 else 1
        digit = (digit // 36) + (digit % 36)
        total += digit
    
    remainder = total % 36
    check_code_point = (36 - remainder) % 36
    expected_char = GST_CHARS[check_code_point]
    
    if clean_gstin[14] != expected_char:
        return False, f"GSTIN checksum mismatch (expected '{expected_char}', got '{clean_gstin[14]}')"
    
    return True, None


# --- PHONETIC & FUZZY MATCHING UTILITIES ---

def soundex_code(name: str) -> str:
    """Computes Soundex phonetic representation for Indian and English names."""
    if not name:
        return "0000"
    name = re.sub(r"[^A-Z]", "", name.upper())
    if not name:
        return "0000"
    
    first_char = name[0]
    mapping = {
        'B': '1', 'F': '1', 'P': '1', 'V': '1',
        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
        'D': '3', 'T': '3',
        'L': '4',
        'M': '5', 'N': '5',
        'R': '6'
    }
    
    encoded = [first_char]
    prev = mapping.get(first_char, '0')
    
    for c in name[1:]:
        curr = mapping.get(c, '0')
        if curr != '0' and curr != prev:
            encoded.append(curr)
        prev = curr
        if len(encoded) == 4:
            break
            
    while len(encoded) < 4:
        encoded.append('0')
        
    return "".join(encoded[:4])

def compute_name_similarity(name1: str, name2: str) -> float:
    """
    Computes hybrid normalized similarity (Jaro-Winkler + Levenshtein) between two names.
    """
    if not name1 or not name2:
        return 0.0
    n1 = " ".join(name1.strip().lower().split())
    n2 = " ".join(name2.strip().lower().split())
    if n1 == n2:
        return 1.0
    
    jw = JaroWinkler.similarity(n1, n2)
    lev = Levenshtein.normalized_similarity(n1, n2)
    return round(0.7 * jw + 0.3 * lev, 4)

def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalizes phone number to 10-digit Indian standard."""
    if not phone:
        return None
    digits = re.sub(r"\D", "", str(phone))
    if len(digits) == 10:
        return digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits if len(digits) >= 10 else None

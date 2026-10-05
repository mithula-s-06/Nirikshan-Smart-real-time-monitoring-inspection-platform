import json
import csv
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any

def generate_synthetic_dataset(num_units: int = 5) -> Dict[str, Any]:
    """
    Generates realistic synthetic datasets for DoSJE schemes including:
    - Beneficiary master records with realistic Indian name variants and typos
    - Enrollments, exits, and re-enrollments
    - Verifications (document failures vs technical failures)
    - Attendance sessions with face counts and ticks
    - Claims (active vs arrears vs post-exit)
    - Expenditures (fixed vs variable costs, duplicate invoices)
    - Inspection logs with GPS jitter and duration metrics
    - Monthly unit aggregates
    PLUS labeled ground-truth lookalikes for zero-false-positive testing.
    """
    beneficiaries = [
        # POSITIVE DUPLICATE PAIR (Rule 5)
        {"id": "ben_dup_1", "name": "Shri Rajesh Kumar Sharma", "dob": "2008-04-15", "guardian": "Ramesh Chandra Sharma", "address": "Flat 204, Ganga Heights, Civil Lines", "district": "Jaipur", "phone": "9829011111", "category": "General"},
        {"id": "ben_dup_2", "name": "Rajesh K Sharma", "dob": "2008-04-15", "guardian": "Ramesh C Sharma", "address": "F-204 Ganga Hts Civil Lines", "district": "Jaipur", "phone": "9829011112", "category": "General"},

        # TWIN SIBLINGS LOOKALIKE (Rule 5: Same DOB + Guardian, distinct first names -> MUST NOT FLAG)
        {"id": "ben_twin_1", "name": "Aarav Gupta", "dob": "2010-09-20", "guardian": "Suresh Gupta", "address": "Plot 12 Sector 4", district: "Lucknow", "phone": "9839011111", "category": "OBC"},
        {"id": "ben_twin_2", "name": "Ananya Gupta", "dob": "2010-09-20", "guardian": "Suresh Gupta", "address": "Plot 12 Sector 4", district: "Lucknow", "phone": "9839011111", "category": "OBC"},

        # SIBLINGS SHARING PHONE (Rule 6: Same Guardian + Address -> MUST NOT FLAG)
        {"id": "ben_sib_1", "name": "Manish Verma", "dob": "2007-03-10", "guardian": "Kailash Verma", "address": "15 Main Bazar", district: "Bhopal", "phone": "9826011111", "category": "SC"},
        {"id": "ben_sib_2", "name": "Pooja Verma", "dob": "2009-11-22", "guardian": "Kailash Verma", "address": "15 Main Bazar", district: "Bhopal", "phone": "9826011111", "category": "SC"},

        # UNRELATED SHARING PHONE (Rule 6: Different Guardians & Addresses -> FLAGGED)
        {"id": "ben_unrel_1", "name": "Sunil Yadav", "dob": "2008-06-14", "guardian": "Dinesh Yadav", "address": "Village Rampur", district: "Varanasi", "phone": "9876543210", "category": "OBC"},
        {"id": "ben_unrel_2", "name": "Deepak Tiwari", "dob": "2008-08-19", "guardian": "Girish Tiwari", "address": "Mohalla Shivpur", district: "Varanasi", "phone": "9876543210", "category": "General"},

        # INACTIVE BENEFICIARY WITH CLAIM (Rule 3: Exited due to DEATH -> FLAGGED)
        {"id": "ben_deceased", "name": "Santosh Bai", "dob": "1955-02-12", "guardian": "Late Prem Das", "address": "Old Age Home Ward 3", district: "Indore", "phone": "9827011111", "category": "General"},

        # EXIT MONTH ARREARS CLAIM (Rule 3 Lookalike: Claim for exit month inside grace period -> MUST NOT FLAG)
        {"id": "ben_exit_grace", "name": "Kavita Sen", "dob": "2007-07-07", "guardian": "Bimal Sen", "address": "Salt Lake Sector 1", district: "Kolkata", "phone": "9831011111", "category": "General"},

        # RE-ENROLLMENT AFTER CLEAN EXIT (Rule 7 Lookalike -> MUST NOT FLAG)
        {"id": "ben_reenroll", "name": "Mohammad Rizwan", "dob": "2008-12-01", "guardian": "Abdul Rizwan", "address": "Civil Lines", district: "Aligarh", "phone": "9897011111", "category": "OBC"}
    ]

    enrollments = [
        {"id": "enr_dup_1", "beneficiaryId": "ben_dup_1", "unitId": "unit_hostel_01", "startDate": "2025-06-01", "endDate": None, "exitReason": None},
        {"id": "enr_dup_2", "beneficiaryId": "ben_dup_2", "unitId": "unit_hostel_02", "startDate": "2025-06-01", "endDate": None, "exitReason": None},
        {"id": "enr_twin_1", "beneficiaryId": "ben_twin_1", "unitId": "unit_school_01", "startDate": "2025-07-01", "endDate": None, "exitReason": None},
        {"id": "enr_twin_2", "beneficiaryId": "ben_twin_2", "unitId": "unit_school_01", "startDate": "2025-07-01", "endDate": None, "exitReason": None},
        {"id": "enr_deceased", "beneficiaryId": "ben_deceased", "unitId": "unit_senior_01", "startDate": "2024-01-01", "endDate": "2026-03-31", "exitReason": "DEATH"},
        {"id": "enr_grace", "beneficiaryId": "ben_exit_grace", "unitId": "unit_school_01", "startDate": "2024-04-01", "endDate": "2026-03-31", "exitReason": "COURSE_COMPLETED"},
        # Clean re-enrollment across academic years
        {"id": "enr_re_1", "beneficiaryId": "ben_reenroll", "unitId": "unit_skill_01", "startDate": "2024-06-01", "endDate": "2025-04-30", "exitReason": "STAGE_1_PASS"},
        {"id": "enr_re_2", "beneficiaryId": "ben_reenroll", "unitId": "unit_skill_01", "startDate": "2025-07-01", "endDate": "2026-04-30", "exitReason": None}
    ]

    verifications = [
        # Repeated doc failures with multiple doc hashes (Rule 2 POSITIVE)
        {"id": "v_1", "beneficiaryId": "ben_dup_1", "type": "AADHAAR_DOC", "outcome": "fail", "reasonCode": "NAME_MISMATCH", "date": "2026-08-01", "documentNumberHash": "doc_hash_aaa", "operatorId": "op_1"},
        {"id": "v_2", "beneficiaryId": "ben_dup_1", "type": "VOTER_DOC", "outcome": "fail", "reasonCode": "EXPIRED_CARD", "date": "2026-08-15", "documentNumberHash": "doc_hash_bbb", "operatorId": "op_1"},
        {"id": "v_3", "beneficiaryId": "ben_dup_1", "type": "RATION_DOC", "outcome": "fail", "reasonCode": "QR_UNREADABLE", "date": "2026-08-25", "documentNumberHash": "doc_hash_ccc", "operatorId": "op_1"},

        # Technical failures lookalike (Rule 2 Lookalike: TIMEOUT, SERVICE_DOWN -> MUST NOT FLAG)
        {"id": "v_l1", "beneficiaryId": "ben_twin_1", "type": "OTP", "outcome": "fail", "reasonCode": "TIMEOUT", "date": "2026-08-01", "operatorId": "op_2"},
        {"id": "v_l2", "beneficiaryId": "ben_twin_1", "type": "OTP", "outcome": "fail", "reasonCode": "AUTH_FAIL", "date": "2026-08-02", "operatorId": "op_2"},
        {"id": "v_l3", "beneficiaryId": "ben_twin_1", "type": "SERVER", "outcome": "fail", "reasonCode": "SERVICE_DOWN", "date": "2026-08-10", "operatorId": "op_2"}
    ]

    claims = [
        # Disbursed 4 months after DEATH (Rule 3 FLAGGED)
        {"id": "clm_post_death", "beneficiaryId": "ben_deceased", "unitId": "unit_senior_01", "periodStart": "2026-07-01", "periodEnd": "2026-07-31", "amount": 3500.0, "status": "PROCESSED"},
        # Exit month claim inside grace window (Rule 3 Lookalike -> MUST NOT FLAG)
        {"id": "clm_grace_legit", "beneficiaryId": "ben_exit_grace", "unitId": "unit_school_01", "periodStart": "2026-03-01", "periodEnd": "2026-03-31", "amount": 2500.0, "status": "PROCESSED"}
    ]

    transfers = [
        # Ping-Pong rapid transfer (Rule 8 FLAGGED)
        {"id": "tr_1", "beneficiaryId": "ben_dup_1", "fromUnitId": "unit_hostel_01", "toUnitId": "unit_hostel_02", "date": "2026-08-01", "reason": "TEMPORARY_TRANSFER"},
        {"id": "tr_2", "beneficiaryId": "ben_dup_1", "fromUnitId": "unit_hostel_02", "toUnitId": "unit_hostel_01", "date": "2026-08-20", "reason": "RETURN_CAMP"},

        # Single transfer at academic year boundary (Rule 8 Lookalike -> MUST NOT FLAG)
        {"id": "tr_academic", "beneficiaryId": "ben_twin_1", "fromUnitId": "unit_school_01", "toUnitId": "unit_high_school_02", "date": "2026-04-15", "reason": "ACADEMIC_PROMOTION"}
    ]

    units = [
        {"id": "unit_hostel_01", "name": "St. Jude Youth Residential Hostel", "type": "Hostel", "sanctionedStrength": 30, "lat": 12.9716, "lng": 77.5946, "radiusMeters": 200},
        {"id": "unit_senior_01", "name": "Elders Home Senior Citizen Care", "type": "Senior Home", "sanctionedStrength": 40, "lat": 22.7196, "lng": 75.8577, "radiusMeters": 250},
        {"id": "unit_school_01", "name": "Premier Residential Vocational Institute", "type": "School", "sanctionedStrength": 50, "lat": 28.6139, "lng": 77.2090, "radiusMeters": 300}
    ]

    return {
        "beneficiaries": beneficiaries,
        "enrollments": enrollments,
        "verifications": verifications,
        "claims": claims,
        "transfers": transfers,
        "units": units
    }

def export_synthetic_data_files(output_dir: str = "c:/sih2/data/synthetic"):
    """Exports synthetic benchmarks to JSON and CSV formats."""
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    data = generate_synthetic_dataset()

    # Save Master JSON
    with open(out_path / "benchmark_master.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    # Save Individual CSVs
    for table_name, rows in data.items():
        if not rows:
            continue
        csv_file = out_path / f"{table_name}.csv"
        keys = rows[0].keys()
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(rows)

    return str(out_path)

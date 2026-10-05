/**
 * Synthetic Benchmark Dataset Generator for Beneficiary Data Integrity Rules
 * Generates:
 * 1. Clear Positives (Violations that must be flagged)
 * 2. Clear Negatives (Clean records that must NOT be flagged)
 * 3. Legitimate Lookalikes (Borderline patterns that must NOT be flagged due to legitimate explanation filters)
 */
export function generateBenchmarkDataset() {
  const beneficiaries = [
    // -------------------------------------------------------------
    // RULE 2: Repeated Failed Verification Fixtures
    // -------------------------------------------------------------
    // Ben R2-POS: Flagged (3 doc failures with distinct document hashes in 30 days)
    { id: 'ben_r2_pos', name: 'Vikramaditya Rao', date_of_birth: '2008-05-12', guardian: 'Suresh Rao', address: '12 Temple St', district: 'Bengaluru Urban', phone: '9845012345', category: 'General' },
    // Ben R2-LOOKALIKE: 4 failures, but ALL carry technical reason codes ('TIMEOUT', 'AUTH_FAIL') -> MUST NOT FLAG
    { id: 'ben_r2_lookalike', name: 'Pooja Hegde', date_of_birth: '2009-08-20', guardian: 'Anand Hegde', address: '45 Lake View', district: 'Mysuru', phone: '9845098765', category: 'OBC' },
    // Ben R2-NEG: 1 pass verification
    { id: 'ben_r2_neg', name: 'Manoj Kumar', date_of_birth: '2007-03-15', guardian: 'Rajesh Kumar', address: '88 MG Road', district: 'Bengaluru Urban', phone: '9845055555', category: 'General' },

    // -------------------------------------------------------------
    // RULE 3: Inactive Beneficiary Receiving Benefits Fixtures
    // -------------------------------------------------------------
    // Ben R3-POS-1: Claimed 4 months after exit with exit_reason: DEATH -> Flagged High
    { id: 'ben_r3_pos_death', name: 'Sanjay Mishra', date_of_birth: '2006-11-10', guardian: 'Kamal Mishra', address: 'Sector 5', district: 'Varanasi', phone: '9811122233', category: 'General' },
    // Ben R3-POS-2: Claims with zero enrollment record -> Flagged High
    { id: 'ben_r3_pos_noenr', name: 'Alok Nath', date_of_birth: '2008-01-05', guardian: 'Dinesh Nath', address: 'Main Bazar', district: 'Patna', phone: '9822233344', category: 'OBC' },
    // Ben R3-LOOKALIKE: Claim submitted for exit month, within 30-day grace period -> MUST NOT FLAG
    { id: 'ben_r3_lookalike_grace', name: 'Deepa Sen', date_of_birth: '2007-09-14', guardian: 'Pranab Sen', address: 'Park Circus', district: 'Kolkata', phone: '9833344455', category: 'General' },
    // Ben R3-NEG: Clean active enrollment with valid claim -> Clean
    { id: 'ben_r3_neg', name: 'Kavita Das', date_of_birth: '2008-06-22', guardian: 'Subhash Das', address: 'Salt Lake Sec 2', district: 'Kolkata', phone: '9844455566', category: 'SC' },

    // -------------------------------------------------------------
    // RULE 5: Suspiciously Similar Records (Fuzzy Linkage) Fixtures
    // -------------------------------------------------------------
    // Pair R5-POS: Duplicate Profiles (Shri Rahul A. Sharma vs Rahul Sharma, same DOB, same Guardian, minor address typo) -> Flagged
    { id: 'ben_r5_pos_1', name: 'Shri Rahul A Sharma', date_of_birth: '2009-04-10', guardian: 'Vijay Kumar Sharma', address: 'Flat 402, Shanti Heights, Civil Lines', district: 'Jaipur', phone: '9829011111', category: 'General' },
    { id: 'ben_r5_pos_2', name: 'Rahul Sharma', date_of_birth: '2009-04-10', guardian: 'Vijay K Sharma', address: 'F-402 Shanti Hts Civil Lines', district: 'Jaipur', phone: '9829022222', category: 'General' },
    // Pair R5-LOOKALIKE: Twins (Aryan Verma vs Sneha Verma - Same DOB & Guardian, distinct names) -> MUST NOT FLAG
    { id: 'ben_r5_lookalike_twin_1', name: 'Aryan Verma', date_of_birth: '2010-02-18', guardian: 'Harish Verma', address: '14 Model Town', district: 'Lucknow', phone: '9839011111', category: 'OBC' },
    { id: 'ben_r5_lookalike_twin_2', name: 'Sneha Verma', date_of_birth: '2010-02-18', guardian: 'Harish Verma', address: '14 Model Town', district: 'Lucknow', phone: '9839011111', category: 'OBC' },
    // Pair R5-NEG: Distinct people
    { id: 'ben_r5_neg', name: 'Zoya Akhtar', date_of_birth: '2008-12-05', guardian: 'Farhan Akhtar', address: 'Bandra West', district: 'Mumbai', phone: '9820011111', category: 'General' },

    // -------------------------------------------------------------
    // RULE 6: Repeated Contact Details Fixtures
    // -------------------------------------------------------------
    // Unrelated group sharing same phone 9876500001 (different guardians & addresses) -> Flagged
    { id: 'ben_r6_pos_unrelated_1', name: 'Gaurav Tyagi', date_of_birth: '2007-07-07', guardian: 'Mohan Tyagi', address: 'Nehru Nagar Block A', district: 'Ghaziabad', phone: '+91 9876500001', category: 'General' },
    { id: 'ben_r6_pos_unrelated_2', name: 'Mohit Chawla', date_of_birth: '2008-03-12', guardian: 'Jagdish Chawla', address: 'Govindpuram Sector 3', district: 'Ghaziabad', phone: '09876500001', category: 'OBC' },
    // Siblings sharing parent's phone 9876500002 (Same Guardian & Address) -> MUST NOT FLAG (Lookalike)
    { id: 'ben_r6_lookalike_sib_1', name: 'Rohit Bansal', date_of_birth: '2007-10-10', guardian: 'Om Prakash Bansal', address: 'Shop 5 Nai Basti', district: 'Meerut', phone: '9876500002', category: 'General' },
    { id: 'ben_r6_lookalike_sib_2', name: 'Ritu Bansal', date_of_birth: '2009-05-15', guardian: 'Om Prakash Bansal', address: 'Shop 5 Nai Basti', district: 'Meerut', phone: '9876500002', category: 'General' },
    // Placeholder Phone (1234567890) -> Data Quality finding
    { id: 'ben_r6_dq_placeholder', name: 'Amitabh Joshi', date_of_birth: '2008-09-09', guardian: 'Kailash Joshi', address: 'Civil Lines', district: 'Bhopal', phone: '1234567890', category: 'General' },

    // -------------------------------------------------------------
    // RULE 7: Impossible or Inconsistent Dates Fixtures
    // -------------------------------------------------------------
    // Future DOB (Data quality)
    { id: 'ben_r7_pos_future_dob', name: 'Baby Future', date_of_birth: '2030-01-01', guardian: 'Dev Future', address: 'Future Colony', district: 'Delhi', phone: '9810011111', category: 'General' },
    // Overlapping concurrent enrollments across 2 units (Risk indicator)
    { id: 'ben_r7_pos_concurrent', name: 'Naveen Jindal', date_of_birth: '2007-04-18', guardian: 'R. P. Jindal', address: 'Ring Road', district: 'Raipur', phone: '9827011111', category: 'General' },
    // Re-enrollment after clean exit (Clean lookalike) -> MUST NOT FLAG
    { id: 'ben_r7_lookalike_reenroll', name: 'Divya Bharti', date_of_birth: '2008-02-14', guardian: 'Satish Bharti', address: 'Station Road', district: 'Indore', phone: '9826011111', category: 'General' },

    // -------------------------------------------------------------
    // RULE 8: Unusually Frequent Transfers Fixtures
    // -------------------------------------------------------------
    // Ben R8-POS: Ping-Pong transfer (Unit A -> Unit B -> Unit A within 45 days) -> Flagged High
    { id: 'ben_r8_pos_pingpong', name: 'Sunil Chetri', date_of_birth: '2007-08-03', guardian: 'B. Chetri', address: 'Football Colony', district: 'Bengaluru', phone: '9880011111', category: 'General' },
    // Ben R8-LOOKALIKE: Single transfer at academic year boundary (April 15 with ACADEMIC_PROMOTION) -> MUST NOT FLAG
    { id: 'ben_r8_lookalike_academic', name: 'Meera Nambiar', date_of_birth: '2008-01-20', guardian: 'K. Nambiar', address: 'Beach Road', district: 'Kozhikode', phone: '9847011111', category: 'General' }
  ];

  // -------------------------------------------------------------
  // Enrollments
  // -------------------------------------------------------------
  const enrollments = [
    // Clean enrollment for R2
    { id: 'enr_r2_1', beneficiary_id: 'ben_r2_pos', unit_id: 'unit_south_1', start_date: '2025-06-01', end_date: null },
    { id: 'enr_r2_2', beneficiary_id: 'ben_r2_lookalike', unit_id: 'unit_south_2', start_date: '2025-06-01', end_date: null },
    { id: 'enr_r2_3', beneficiary_id: 'ben_r2_neg', unit_id: 'unit_south_1', start_date: '2025-06-01', end_date: null },

    // R3: Exited on 2026-03-31 due to DEATH
    { id: 'enr_r3_death', beneficiary_id: 'ben_r3_pos_death', unit_id: 'unit_north_1', start_date: '2025-04-01', end_date: '2026-03-31', exit_reason: 'DEATH' },
    // R3 Lookalike: Exited on 2026-03-31 with NORMAL_COMPLETION
    { id: 'enr_r3_grace', beneficiary_id: 'ben_r3_lookalike_grace', unit_id: 'unit_east_1', start_date: '2025-04-01', end_date: '2026-03-31', exit_reason: 'COURSE_COMPLETION' },
    // R3 Clean
    { id: 'enr_r3_clean', beneficiary_id: 'ben_r3_neg', unit_id: 'unit_east_1', start_date: '2025-04-01', end_date: '2026-12-31' },

    // R7 Concurrent enrollments in two different units at the same time
    { id: 'enr_r7_c1', beneficiary_id: 'ben_r7_pos_concurrent', unit_id: 'unit_central_1', start_date: '2025-07-01', end_date: '2026-06-30' },
    { id: 'enr_r7_c2', beneficiary_id: 'ben_r7_pos_concurrent', unit_id: 'unit_central_2', start_date: '2025-09-01', end_date: '2026-08-31' },

    // R7 Clean re-enrollment after previous exit (e.g. Completed Level 1, then enrolled in Level 2 later)
    { id: 'enr_r7_re_1', beneficiary_id: 'ben_r7_lookalike_reenroll', unit_id: 'unit_mp_1', start_date: '2024-06-01', end_date: '2025-04-30', exit_reason: 'COMPLETED_STAGE_1' },
    { id: 'enr_r7_re_2', beneficiary_id: 'ben_r7_lookalike_reenroll', unit_id: 'unit_mp_1', start_date: '2025-07-01', end_date: '2026-04-30', exit_reason: null }
  ];

  // -------------------------------------------------------------
  // Verifications
  // -------------------------------------------------------------
  const verifications = [
    // Rule 2 Pos: 3 Document failures with different document hashes within 25 days
    { id: 'v_r2_1', beneficiary_id: 'ben_r2_pos', type: 'AADHAAR_DOC', outcome: 'fail', reason_code: 'INVALID_NAME_MATCH', date: '2026-08-10', document_number_hash: 'hash_doc_111', operator_id: 'op_99' },
    { id: 'v_r2_2', beneficiary_id: 'ben_r2_pos', type: 'VOTER_DOC', outcome: 'fail', reason_code: 'DOCUMENT_EXPIRED', date: '2026-08-18', document_number_hash: 'hash_doc_222', operator_id: 'op_99' },
    { id: 'v_r2_3', beneficiary_id: 'ben_r2_pos', type: 'RATION_DOC', outcome: 'fail', reason_code: 'UNREADABLE_QR', date: '2026-08-28', document_number_hash: 'hash_doc_333', operator_id: 'op_99' },

    // Rule 2 Lookalike: 4 failures, ALL technical reason codes
    { id: 'v_r2_l1', beneficiary_id: 'ben_r2_lookalike', type: 'UIDAI_OTP', outcome: 'fail', reason_code: 'TIMEOUT', date: '2026-08-05', operator_id: 'op_12' },
    { id: 'v_r2_l2', beneficiary_id: 'ben_r2_lookalike', type: 'UIDAI_OTP', outcome: 'fail', reason_code: 'AUTH_FAIL', date: '2026-08-06', operator_id: 'op_12' },
    { id: 'v_r2_l3', beneficiary_id: 'ben_r2_lookalike', type: 'SERVER', outcome: 'fail', reason_code: 'SERVICE_DOWN', date: '2026-08-12', operator_id: 'op_12' },
    { id: 'v_r2_l4', beneficiary_id: 'ben_r2_lookalike', type: 'NETWORK', outcome: 'fail', reason_code: 'NETWORK_ERR', date: '2026-08-15', operator_id: 'op_12' },

    // Rule 2 Neg: Pass
    { id: 'v_r2_n1', beneficiary_id: 'ben_r2_neg', type: 'AADHAAR_DOC', outcome: 'pass', reason_code: 'VERIFIED', date: '2026-08-01', operator_id: 'op_01' }
  ];

  // -------------------------------------------------------------
  // Claims
  // -------------------------------------------------------------
  const claims = [
    // Rule 3 Pos: Claims for July 2026 and August 2026 (Beneficiary died on 2026-03-31)
    { id: 'clm_r3_1', beneficiary_id: 'ben_r3_pos_death', unit_id: 'unit_north_1', period_start: '2026-07-01', period_end: '2026-07-31', amount: 3500 },
    { id: 'clm_r3_2', beneficiary_id: 'ben_r3_pos_death', unit_id: 'unit_north_1', period_start: '2026-08-01', period_end: '2026-08-31', amount: 3500 },

    // Rule 3 Pos (No enrollment): Claim issued
    { id: 'clm_r3_noenr', beneficiary_id: 'ben_r3_pos_noenr', unit_id: 'unit_north_1', period_start: '2026-06-01', period_end: '2026-06-30', amount: 4000 },

    // Rule 3 Lookalike: Claim for period 2026-03-01 to 2026-03-31 (Exit date 2026-03-31, paid in April within grace period) -> MUST NOT FLAG
    { id: 'clm_r3_grace', beneficiary_id: 'ben_r3_lookalike_grace', unit_id: 'unit_east_1', period_start: '2026-03-01', period_end: '2026-03-31', amount: 3000 },

    // Rule 3 Clean
    { id: 'clm_r3_clean', beneficiary_id: 'ben_r3_neg', unit_id: 'unit_east_1', period_start: '2026-06-01', period_end: '2026-06-30', amount: 3000 }
  ];

  // -------------------------------------------------------------
  // Transfers
  // -------------------------------------------------------------
  const transfers = [
    // Rule 8 Pos: Ping-pong (Unit A -> Unit B on Aug 1, Unit B -> Unit A on Aug 25 - within 24 days)
    { id: 'tr_r8_1', beneficiary_id: 'ben_r8_pos_pingpong', from_unit_id: 'unit_sports_A', to_unit_id: 'unit_sports_B', date: '2026-08-01', reason: 'TEMPORARY_CAMP' },
    { id: 'tr_r8_2', beneficiary_id: 'ben_r8_pos_pingpong', from_unit_id: 'unit_sports_B', to_unit_id: 'unit_sports_A', date: '2026-08-25', reason: 'CAMP_RETURN' },

    // Rule 8 Lookalike: Single transfer on April 15 at academic year boundary -> MUST NOT FLAG
    { id: 'tr_r8_academic', beneficiary_id: 'ben_r8_lookalike_academic', from_unit_id: 'unit_school_1', to_unit_id: 'unit_high_school_2', date: '2026-04-15', reason: 'ACADEMIC_PROMOTION' }
  ];

  // -------------------------------------------------------------
  // Units & Distribution (Rule 4 Fixtures)
  // -------------------------------------------------------------
  const units = [
    // Unit 4-POS: Significant shift without known reason (TVD > 25%, SC dropped to 0%, General up 30%)
    {
      id: 'unit_r4_pos',
      name: 'Model Residential Institute',
      district: 'Jaipur',
      knownEvent: null,
      baselineDistribution: { 'General': 0.30, 'OBC': 0.30, 'SC': 0.25, 'ST': 0.15 }
    },
    // Unit 4-LOOKALIKE: Similar shift, but has registered 'NEW_INTAKE_CYCLE' -> MUST NOT FLAG
    {
      id: 'unit_r4_lookalike',
      name: 'Kasturba Model Girls Home',
      district: 'Jaipur',
      knownEvent: 'NEW_INTAKE_CYCLE',
      baselineDistribution: { 'General': 0.30, 'OBC': 0.30, 'SC': 0.25, 'ST': 0.15 }
    }
  ];

  // Populate 25 members for unit_r4_pos (20 General, 5 OBC, 0 SC, 0 ST -> massive shift)
  for (let i = 1; i <= 25; i++) {
    const benId = `ben_u4_pos_${i}`;
    beneficiaries.push({
      id: benId,
      name: `Beneficiary U4 ${i}`,
      category: i <= 20 ? 'General' : 'OBC'
    });
    enrollments.push({
      id: `enr_u4_pos_${i}`,
      beneficiary_id: benId,
      unit_id: 'unit_r4_pos',
      start_date: '2026-01-01'
    });
  }

  // Populate 25 members for unit_r4_lookalike (intake cycle shift)
  for (let i = 1; i <= 25; i++) {
    const benId = `ben_u4_look_${i}`;
    beneficiaries.push({
      id: benId,
      name: `Beneficiary U4 Lookalike ${i}`,
      category: i <= 20 ? 'General' : 'OBC'
    });
    enrollments.push({
      id: `enr_u4_look_${i}`,
      beneficiary_id: benId,
      unit_id: 'unit_r4_lookalike',
      start_date: '2026-04-01'
    });
  }

  return {
    beneficiaries,
    enrollments,
    verifications,
    claims,
    transfers,
    units
  };
}

/**
 * Expected Ground Truth Labels for Evaluation & Precision/Recall Calculation
 */
export const BENCHMARK_GROUND_TRUTH = {
  // Expected Flags (True Positives)
  expectedFlags: [
    { ruleId: 'RULE_2_REPEATED_FAILED_VERIFICATION', entityId: 'ben_r2_pos', reason: '3 document failures in 25 days with 3 distinct doc hashes' },
    { ruleId: 'RULE_3_INACTIVE_BENEFICIARY_CLAIM', entityId: 'ben_r3_pos_death', reason: 'Claim after exit due to DEATH' },
    { ruleId: 'RULE_3_INACTIVE_BENEFICIARY_CLAIM', entityId: 'ben_r3_pos_noenr', reason: 'Claim without any enrollment record' },
    { ruleId: 'RULE_4_UNUSUAL_DISTRIBUTION', entityId: 'unit_r4_pos', reason: 'Major demographic shift without registered intake cycle' },
    { ruleId: 'RULE_5_SIMILAR_RECORDS', entityId: 'ben_r5_pos_1 & ben_r5_pos_2', reason: 'Near identical duplicate profile' },
    { ruleId: 'RULE_6_REPEATED_CONTACT', reason: 'Phone shared across unrelated families' },
    { ruleId: 'RULE_7_INCONSISTENT_DATES', entityId: 'ben_r7_pos_future_dob', reason: 'Date of birth in the future' },
    { ruleId: 'RULE_7_INCONSISTENT_DATES', entityId: 'ben_r7_pos_concurrent', reason: 'Concurrent overlapping enrollments in 2 units' },
    { ruleId: 'RULE_8_FREQUENT_TRANSFERS', entityId: 'ben_r8_pos_pingpong', reason: 'Ping-pong transfer in 24 days' }
  ],

  // Legitimate Lookalikes that MUST NOT be flagged (Test for False Positives)
  lookalikesExpectedSuppressed: [
    { ruleId: 'RULE_2_REPEATED_FAILED_VERIFICATION', entityId: 'ben_r2_lookalike', lookalikeName: 'Failures with technical reason codes (TIMEOUT, AUTH_FAIL)' },
    { ruleId: 'RULE_3_INACTIVE_BENEFICIARY_CLAIM', entityId: 'ben_r3_lookalike_grace', lookalikeName: 'Claim for exit month within 30-day grace period' },
    { ruleId: 'RULE_4_UNUSUAL_DISTRIBUTION', entityId: 'unit_r4_lookalike', lookalikeName: 'Demographic shift during registered NEW_INTAKE_CYCLE' },
    { ruleId: 'RULE_5_SIMILAR_RECORDS', entityId: 'ben_r5_lookalike_twin_1 & ben_r5_lookalike_twin_2', lookalikeName: 'Twins with same DOB & Guardian but distinct names' },
    { ruleId: 'RULE_6_REPEATED_CONTACT', lookalikeName: 'Siblings sharing same parent phone' },
    { ruleId: 'RULE_7_INCONSISTENT_DATES', entityId: 'ben_r7_lookalike_reenroll', lookalikeName: 'Re-enrollment in second course after clean exit' },
    { ruleId: 'RULE_8_FREQUENT_TRANSFERS', entityId: 'ben_r8_lookalike_academic', lookalikeName: 'Single transfer at academic year boundary with ACADEMIC_PROMOTION' }
  ]
};

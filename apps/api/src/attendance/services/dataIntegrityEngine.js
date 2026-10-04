import {
  normalizeText,
  jaroWinklerSimilarity,
  tokenJaccardSimilarity,
  normalizePhone,
  normalizeDate,
  calculateAge,
  daysBetween,
  calculateDistributionMetrics
} from '../utils/integrityUtils.js';

export const DEFAULT_SCHEME_CONFIG = {
  schemeId: 'SCHEME_DEFAULT',
  schemeName: 'National Beneficiary Welfare Scheme',
  ageRange: { min: 5, max: 25 },
  rule2: {
    windowDays: 60,
    minFailures: 3,
    excludeTechnicalReasonCodes: [
      'TECH_ERR',
      'TIMEOUT',
      'AUTH_FAIL',
      'SERVICE_DOWN',
      'NETWORK_ERR',
      'BIOMETRIC_SENSOR_ERR',
      'SYSTEM_MAINTENANCE'
    ],
    multiDocEscalateThreshold: 2
  },
  rule3: {
    graceDays: 30, // 30-day grace allowing exit month payment
    highRiskExitReasons: ['DEATH', 'MIGRATION', 'PERMANENT_EXPULSION', 'CONFIRMED_FRAUD']
  },
  rule4: {
    minUnitCount: 15,
    tvdThreshold: 0.15, // Total Variation Distance > 15%
    chiSquareThreshold: 7.81, // Chi-square critical value for df=3 at p=0.05
    knownEvents: ['NEW_INTAKE_CYCLE', 'CRITERIA_EXPANSION', 'SANCTION_INCREASE', 'ANNUAL_BATCH_ADMISSION']
  },
  rule5: {
    weights: { name: 0.40, dob: 0.25, guardian: 0.20, address: 0.15 },
    mediumThreshold: 0.72,
    highThreshold: 0.86,
    minFirstNameSimilarityForTwin: 0.70 // First name similarity must be >= 0.70 to flag when DOB and Guardian are identical
  },
  rule6: {
    minUnrelatedBeneficiaries: 2,
    institutionalWhitelist: ['9800000000', '9900000000', '9811111111', '9822222222', '1800111222']
  },
  rule7: {
    maxFutureToleranceDays: 0
  },
  rule8: {
    windowDays: 180,
    maxTransfersInWindow: 3,
    minStayDays: 30,
    pingPongDays: 90,
    academicMonths: [3, 4, 6], // March, April, June (India academic rollover)
    allowedReasons: [
      'ACADEMIC_PROMOTION',
      'DISTRICT_REORGANIZATION',
      'PARENT_TRANSFER',
      'ANNUAL_SESSION_CHANGE',
      'INSTITUTE_UPGRADATION'
    ]
  }
};

/**
 * =========================================================================
 * RULE 2: Repeated Failed Verification
 * =========================================================================
 */
export function checkRule2RepeatedFailedVerification(verifications = [], beneficiaries = [], config = DEFAULT_SCHEME_CONFIG) {
  const findings = [];
  const r2Config = { ...DEFAULT_SCHEME_CONFIG.rule2, ...(config.rule2 || {}) };
  const techCodes = new Set(r2Config.excludeTechnicalReasonCodes.map(c => c.toUpperCase()));

  const benMap = new Map((beneficiaries || []).map(b => [b.id, b]));
  const byBeneficiary = new Map();
  const byOperator = new Map();

  for (const v of verifications) {
    if (!v.beneficiary_id) continue;
    const bId = v.beneficiary_id;
    if (!byBeneficiary.has(bId)) byBeneficiary.set(bId, []);
    byBeneficiary.get(bId).push(v);

    if (v.operator_id) {
      if (!byOperator.has(v.operator_id)) byOperator.set(v.operator_id, []);
      byOperator.get(v.operator_id).push(v);
    }
  }

  for (const [benId, events] of byBeneficiary.entries()) {
    const docFailures = events.filter(e => {
      const isFail = String(e.outcome).toLowerCase() === 'fail';
      const reason = (e.reason_code || '').toUpperCase();
      return isFail && !techCodes.has(reason);
    });

    if (docFailures.length === 0) continue;

    docFailures.sort((a, b) => new Date(normalizeDate(a.date)) - new Date(normalizeDate(b.date)));

    let maxCluster = [];
    for (let i = 0; i < docFailures.length; i++) {
      const startD = new Date(normalizeDate(docFailures[i].date));
      const currentWindow = [];
      for (let j = i; j < docFailures.length; j++) {
        const endD = new Date(normalizeDate(docFailures[j].date));
        const diffDays = (endD - startD) / (1000 * 60 * 60 * 24);
        if (diffDays <= r2Config.windowDays) {
          currentWindow.push(docFailures[j]);
        } else {
          break;
        }
      }
      if (currentWindow.length > maxCluster.length) {
        maxCluster = currentWindow;
      }
    }

    if (maxCluster.length >= r2Config.minFailures) {
      const distinctDocHashes = new Set(maxCluster.map(f => f.document_number_hash).filter(Boolean));
      const distinctDocCount = distinctDocHashes.size;

      const isHighSeverity = maxCluster.length >= (r2Config.minFailures + 2) || distinctDocCount >= r2Config.multiDocEscalateThreshold;
      const ben = benMap.get(benId);

      findings.push({
        id: `finding_r2_${benId}_${Date.now()}`,
        ruleId: 'RULE_2_REPEATED_FAILED_VERIFICATION',
        ruleName: 'Repeated Failed Verification',
        category: 'risk_indicator',
        severity: isHighSeverity ? 'high' : 'medium',
        entityType: 'beneficiary',
        entityId: benId,
        entityName: ben ? ben.name : `Beneficiary ${benId}`,
        title: `${maxCluster.length} Document Verification Failures in ${r2Config.windowDays} Days`,
        description: `Beneficiary accumulated ${maxCluster.length} document verification failures within a ${r2Config.windowDays}-day window (excluding technical errors). ${distinctDocCount > 1 ? `Attempted ${distinctDocCount} different document numbers, suggesting trial-and-error spoofing.` : 'Consistent document rejection.'}`,
        evidence: {
          failureCountInWindow: maxCluster.length,
          windowDays: r2Config.windowDays,
          distinctDocumentsAttempted: distinctDocCount,
          reasons: maxCluster.map(f => f.reason_code || 'INVALID_DOCUMENT'),
          dates: maxCluster.map(f => normalizeDate(f.date)),
          technicalFailuresExcluded: events.filter(e => techCodes.has((e.reason_code || '').toUpperCase())).length
        },
        legitimateFilterApplied: 'Technical errors (timeouts, network, auth) filtered out',
        timestamp: new Date().toISOString()
      });
    }
  }

  for (const [opId, opEvents] of byOperator.entries()) {
    const totalOp = opEvents.length;
    if (totalOp < 10) continue;
    const opFailures = opEvents.filter(e => String(e.outcome).toLowerCase() === 'fail' && !techCodes.has((e.reason_code || '').toUpperCase()));
    const failRate = opFailures.length / totalOp;

    if (failRate > 0.60 && opFailures.length >= 8) {
      findings.push({
        id: `finding_r2_op_${opId}_${Date.now()}`,
        ruleId: 'RULE_2_REPEATED_FAILED_VERIFICATION',
        ruleName: 'Operator-Level Abnormal Verification Failures',
        category: 'risk_indicator',
        severity: 'high',
        entityType: 'operator',
        entityId: opId,
        entityName: `Operator ${opId}`,
        title: `Operator ${opId} Has ${Math.round(failRate * 100)}% Document Failure Rate`,
        description: `Operator submitted ${opFailures.length} failed document verifications out of ${totalOp} total submissions. May indicate suspicious enrollment attempts or lack of training.`,
        evidence: {
          totalSubmissions: totalOp,
          failedSubmissions: opFailures.length,
          failureRate: Number(failRate.toFixed(2))
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  return findings;
}

/**
 * =========================================================================
 * RULE 3: Inactive Beneficiary Receiving Benefits
 * =========================================================================
 */
export function checkRule3InactiveBeneficiaryClaim(claims = [], enrollments = [], beneficiaries = [], config = DEFAULT_SCHEME_CONFIG) {
  const findings = [];
  const r3Config = { ...DEFAULT_SCHEME_CONFIG.rule3, ...(config.rule3 || {}) };
  const highRiskReasons = new Set((r3Config.highRiskExitReasons || []).map(r => r.toUpperCase()));

  const benMap = new Map((beneficiaries || []).map(b => [b.id, b]));

  const enrollmentsByBen = new Map();
  for (const enr of enrollments) {
    if (!enr.beneficiary_id) continue;
    const bId = enr.beneficiary_id;
    if (!enrollmentsByBen.has(bId)) enrollmentsByBen.set(bId, []);
    enrollmentsByBen.get(bId).push({
      ...enr,
      start: normalizeDate(enr.start_date || enr.start),
      end: normalizeDate(enr.end_date || enr.end),
      exitReason: (enr.exit_reason || '').toUpperCase()
    });
  }

  const claimsByBen = new Map();
  for (const c of claims) {
    if (!c.beneficiary_id) continue;
    const bId = c.beneficiary_id;
    if (!claimsByBen.has(bId)) claimsByBen.set(bId, []);
    claimsByBen.get(bId).push({
      ...c,
      periodStart: normalizeDate(c.period_start || c.start_date),
      periodEnd: normalizeDate(c.period_end || c.end_date),
      amount: Number(c.amount || 0)
    });
  }

  for (const [benId, benClaims] of claimsByBen.entries()) {
    const userEnrollments = enrollmentsByBen.get(benId) || [];
    const ben = benMap.get(benId);

    if (userEnrollments.length === 0) {
      const totalAmount = benClaims.reduce((acc, c) => acc + c.amount, 0);
      findings.push({
        id: `finding_r3_noenr_${benId}_${Date.now()}`,
        ruleId: 'RULE_3_INACTIVE_BENEFICIARY_CLAIM',
        ruleName: 'Claim Without Any Enrollment Record',
        category: 'risk_indicator',
        severity: 'high',
        entityType: 'beneficiary',
        entityId: benId,
        entityName: ben ? ben.name : `Beneficiary ${benId}`,
        title: `${benClaims.length} Claims Without Any Enrollment Record (₹${totalAmount.toLocaleString()})`,
        description: `Beneficiary has ${benClaims.length} benefit claim(s) totaling ₹${totalAmount.toLocaleString()}, but possesses zero enrollment records in the system.`,
        evidence: {
          claimsCount: benClaims.length,
          totalAmountAtRisk: totalAmount,
          claims: benClaims.map(c => ({ id: c.id, period: `${c.periodStart} to ${c.periodEnd}`, amount: c.amount }))
        },
        legitimateFilterApplied: 'No enrollment periods found in master registry',
        timestamp: new Date().toISOString()
      });
      continue;
    }

    const invalidClaims = [];
    let exitReasonTrigger = null;

    for (const claim of benClaims) {
      if (!claim.periodStart || !claim.periodEnd) continue;

      const claimStart = new Date(claim.periodStart);
      const claimEnd = new Date(claim.periodEnd);

      let covered = false;
      for (const enr of userEnrollments) {
        if (!enr.start) continue;
        const enrStart = new Date(enr.start);
        
        let enrEndWithGrace = null;
        if (enr.end) {
          const rawEnd = new Date(enr.end);
          enrEndWithGrace = new Date(rawEnd.getTime() + (r3Config.graceDays || 30) * 24 * 60 * 60 * 1000);
        }

        const startValid = !enrEndWithGrace || claimStart <= enrEndWithGrace;
        const endValid = claimEnd >= enrStart;

        if (startValid && endValid) {
          covered = true;
          break;
        }
      }

      if (!covered) {
        invalidClaims.push(claim);
        const latestEnr = [...userEnrollments].sort((a, b) => new Date(b.end || '9999-12-31') - new Date(a.end || '9999-12-31'))[0];
        if (latestEnr && highRiskReasons.has(latestEnr.exitReason)) {
          exitReasonTrigger = latestEnr.exitReason;
        }
      }
    }

    if (invalidClaims.length > 0) {
      const amountAtRisk = invalidClaims.reduce((acc, c) => acc + c.amount, 0);
      const isHigh = Boolean(exitReasonTrigger) || invalidClaims.length >= 2 || amountAtRisk >= 10000;

      findings.push({
        id: `finding_r3_inactive_${benId}_${Date.now()}`,
        ruleId: 'RULE_3_INACTIVE_BENEFICIARY_CLAIM',
        ruleName: 'Benefit Claims Outside Enrollment Period',
        category: 'risk_indicator',
        severity: isHigh ? 'high' : 'medium',
        entityType: 'beneficiary',
        entityId: benId,
        entityName: ben ? ben.name : `Beneficiary ${benId}`,
        title: `₹${amountAtRisk.toLocaleString()} Claimed After Exit / Inactive Period (${invalidClaims.length} Claims)`,
        description: `Beneficiary was issued ${invalidClaims.length} claim(s) for periods outside active enrollments (allowing a ${r3Config.graceDays}-day exit grace period). ${exitReasonTrigger ? `Exit reason recorded as '${exitReasonTrigger}', representing severe compliance violation.` : 'Enrollment ended prior to claim period.'}`,
        evidence: {
          claimsCount: invalidClaims.length,
          totalAmountAtRisk: amountAtRisk,
          exitReason: exitReasonTrigger || 'NORMAL_EXIT',
          gracePeriodDays: r3Config.graceDays,
          invalidClaimPeriods: invalidClaims.map(c => ({ id: c.id, period: `${c.periodStart} to ${c.periodEnd}`, amount: c.amount })),
          enrollmentPeriods: userEnrollments.map(e => `${e.start} to ${e.end || 'Active'} (Exit: ${e.exitReason || 'None'})`)
        },
        legitimateFilterApplied: `${r3Config.graceDays}-day exit month grace period applied; arrears before exit permitted`,
        timestamp: new Date().toISOString()
      });
    }
  }

  return findings;
}

/**
 * =========================================================================
 * RULE 4: Unusual Beneficiary Distribution
 * =========================================================================
 */
export function checkRule4UnusualDistribution(beneficiaries = [], enrollments = [], units = [], config = DEFAULT_SCHEME_CONFIG) {
  const findings = [];
  const r4Config = { ...DEFAULT_SCHEME_CONFIG.rule4, ...(config.rule4 || {}) };
  const knownEventsSet = new Set((r4Config.knownEvents || []).map(e => e.toUpperCase()));

  const benCategoryMap = new Map((beneficiaries || []).map(b => [b.id, b.category || 'General']));
  const unitBeneficiaries = new Map();

  for (const enr of enrollments) {
    if (!enr.unit_id || !enr.beneficiary_id) continue;
    const cat = benCategoryMap.get(enr.beneficiary_id) || 'General';
    if (!unitBeneficiaries.has(enr.unit_id)) unitBeneficiaries.set(enr.unit_id, []);
    unitBeneficiaries.get(enr.unit_id).push(cat);
  }

  const defaultBaseline = config.categoryBaseline || {
    'General': 0.35,
    'OBC': 0.35,
    'SC': 0.20,
    'ST': 0.10
  };

  const unitMap = new Map((units || []).map(u => [u.id, u]));

  for (const [unitId, catList] of unitBeneficiaries.entries()) {
    const totalCount = catList.length;

    if (totalCount < r4Config.minUnitCount) continue;

    const observedCounts = {};
    for (const c of catList) {
      observedCounts[c] = (observedCounts[c] || 0) + 1;
    }

    const unitInfo = unitMap.get(unitId) || {};
    const unitBaseline = unitInfo.baselineDistribution || defaultBaseline;

    const stats = calculateDistributionMetrics(observedCounts, unitBaseline);

    const hasKnownEvent = unitInfo.knownEvent && knownEventsSet.has(String(unitInfo.knownEvent).toUpperCase());

    if (stats.tvd >= r4Config.tvdThreshold && stats.chiSquare >= r4Config.chiSquareThreshold) {
      if (hasKnownEvent) {
        continue;
      }

      const topShift = stats.shifts[0];
      const isHigh = stats.tvd >= 0.30;

      findings.push({
        id: `finding_r4_dist_${unitId}_${Date.now()}`,
        ruleId: 'RULE_4_UNUSUAL_DISTRIBUTION',
        ruleName: 'Unusual Beneficiary Distribution Shift',
        category: 'risk_indicator',
        severity: isHigh ? 'high' : 'medium',
        entityType: 'unit',
        entityId: unitId,
        entityName: unitInfo.name || `Unit ${unitId}`,
        title: `Abnormal Demographic Shift (TVD: ${(stats.tvd * 100).toFixed(0)}%, $\\chi^2$: ${stats.chiSquare})`,
        description: `Unit exhibits a significant departure from historical baseline proportions. Primary driver: ${topShift ? `Category '${topShift.category}' shifted by ${topShift.shiftPoints > 0 ? '+' : ''}${topShift.shiftPoints}%` : 'Multiple categories shifted'}.`,
        evidence: {
          totalBeneficiariesEvaluated: totalCount,
          totalVariationDistance: stats.tvd,
          chiSquareStatistic: stats.chiSquare,
          categoryShifts: stats.shifts,
          knownEventRegistered: unitInfo.knownEvent || 'None'
        },
        legitimateFilterApplied: 'Known intake cycles and minimum unit count threshold checked',
        timestamp: new Date().toISOString()
      });
    }
  }

  return findings;
}

/**
 * =========================================================================
 * RULE 5: Suspiciously Similar Records (Fuzzy Linkage)
 * =========================================================================
 */
export function checkRule5SimilarRecords(beneficiaries = [], config = DEFAULT_SCHEME_CONFIG) {
  const findings = [];
  const r5Config = { ...DEFAULT_SCHEME_CONFIG.rule5, ...(config.rule5 || {}) };
  const weights = r5Config.weights || { name: 0.40, dob: 0.25, guardian: 0.20, address: 0.15 };

  const blocks = new Map();

  function addToBlock(key, b) {
    if (!key) return;
    if (!blocks.has(key)) blocks.set(key, []);
    blocks.get(key).push(b);
  }

  for (const b of beneficiaries) {
    const dob = normalizeDate(b.date_of_birth || b.dob);
    if (dob) addToBlock(`dob_${dob}`, b);

    const dist = normalizeText(b.district || '');
    const guardianNorm = normalizeText(b.guardian || b.guardian_name || '');
    if (dist && guardianNorm.length >= 3) {
      addToBlock(`dg_${dist}_${guardianNorm.substring(0, 3)}`, b);
    }
  }

  const comparedPairs = new Set();

  for (const [blockKey, candidates] of blocks.entries()) {
    if (candidates.length < 2) continue;

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const b1 = candidates[i];
        const b2 = candidates[j];
        if (b1.id === b2.id) continue;

        const pairKey = [b1.id, b2.id].sort().join(':::');
        if (comparedPairs.has(pairKey)) continue;
        comparedPairs.add(pairKey);

        const normName1 = normalizeText(b1.name);
        const normName2 = normalizeText(b2.name);
        const nameSim = jaroWinklerSimilarity(normName1, normName2);

        // First Name comparison for Twin / Sibling separation
        const firstName1 = normName1.split(' ')[0] || '';
        const firstName2 = normName2.split(' ')[0] || '';
        const firstNameSim = jaroWinklerSimilarity(firstName1, firstName2);

        const dob1 = normalizeDate(b1.date_of_birth || b1.dob);
        const dob2 = normalizeDate(b2.date_of_birth || b2.dob);
        let dobSim = 0;
        if (dob1 && dob2) {
          if (dob1 === dob2) dobSim = 1.0;
          else if (Math.abs(daysBetween(dob1, dob2)) <= 30) dobSim = 0.5;
        }

        const g1 = normalizeText(b1.guardian || b1.guardian_name || '');
        const g2 = normalizeText(b2.guardian || b2.guardian_name || '');
        const guardianSim = jaroWinklerSimilarity(g1, g2);

        const a1 = b1.address || '';
        const a2 = b2.address || '';
        const addrSim = tokenJaccardSimilarity(a1, a2);

        // Twin / Sibling Legitimate Filter:
        // When DOB is identical and Guardian is same, but First Names are clearly distinct (firstNameSim < 0.70)
        // -> Legitimate twins / siblings sharing surname and guardian -> DO NOT FLAG
        if (dobSim === 1.0 && guardianSim >= 0.85 && firstNameSim < (r5Config.minFirstNameSimilarityForTwin || 0.70)) {
          continue;
        }

        const compositeScore = Number((
          nameSim * weights.name +
          dobSim * weights.dob +
          guardianSim * weights.guardian +
          addrSim * weights.address
        ).toFixed(3));

        if (compositeScore >= r5Config.mediumThreshold) {
          const isHigh = compositeScore >= r5Config.highThreshold;

          findings.push({
            id: `finding_r5_${b1.id}_${b2.id}_${Date.now()}`,
            ruleId: 'RULE_5_SIMILAR_RECORDS',
            ruleName: 'Suspiciously Similar Beneficiary Records',
            category: 'risk_indicator',
            severity: isHigh ? 'high' : 'medium',
            entityType: 'pair',
            entityId: `${b1.id} & ${b2.id}`,
            entityName: `${b1.name} / ${b2.name}`,
            title: `Potential Duplicate Profile Match (${Math.round(compositeScore * 100)}% Similarity)`,
            description: `Two records share suspiciously close personal details across name, guardian, birth date, and address. Requires human review to prevent dual benefit disbursement.`,
            evidence: {
              compositeSimilarityScore: compositeScore,
              fieldSimilarities: {
                nameScore: Number(nameSim.toFixed(3)),
                firstNameScore: Number(firstNameSim.toFixed(3)),
                dobScore: Number(dobSim.toFixed(3)),
                guardianScore: Number(guardianSim.toFixed(3)),
                addressScore: Number(addrSim.toFixed(3))
              },
              recordA: { id: b1.id, name: b1.name, dob: dob1, guardian: b1.guardian, address: b1.address, district: b1.district },
              recordB: { id: b2.id, name: b2.name, dob: dob2, guardian: b2.guardian, address: b2.address, district: b2.district }
            },
            legitimateFilterApplied: 'Twin/sibling filter verified (distinct first names with same guardian/DOB excluded)',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  return findings;
}

/**
 * =========================================================================
 * RULE 6: Repeated Contact Details
 * =========================================================================
 */
export function checkRule6RepeatedContact(beneficiaries = [], config = DEFAULT_SCHEME_CONFIG) {
  const findings = [];
  const r6Config = { ...DEFAULT_SCHEME_CONFIG.rule6, ...(config.rule6 || {}) };
  const whitelist = new Set(r6Config.institutionalWhitelist || []);

  const phoneClusters = new Map();
  const bankClusters = new Map();

  for (const b of beneficiaries) {
    const pInfo = normalizePhone(b.phone || b.mobile);

    if (pInfo.isPlaceholder || (!pInfo.valid && b.phone)) {
      findings.push({
        id: `finding_r6_dq_phone_${b.id}_${Date.now()}`,
        ruleId: 'RULE_6_REPEATED_CONTACT',
        ruleName: 'Invalid or Placeholder Phone Number',
        category: 'data_quality',
        severity: 'low',
        entityType: 'beneficiary',
        entityId: b.id,
        entityName: b.name,
        title: `Invalid/Placeholder Phone: ${pInfo.masked || 'Format Error'}`,
        description: `Phone number '${pInfo.raw}' is invalid or recognized as a repetitive placeholder (e.g., 1234567890, 9999999999).`,
        evidence: { rawPhone: pInfo.raw, reason: 'Invalid Indian mobile format or placeholder digits' },
        timestamp: new Date().toISOString()
      });
      continue;
    }

    if (pInfo.valid) {
      if (whitelist.has(pInfo.normalized)) {
        continue;
      }
      if (!phoneClusters.has(pInfo.normalized)) {
        phoneClusters.set(pInfo.normalized, { info: pInfo, members: [] });
      }
      phoneClusters.get(pInfo.normalized).members.push(b);
    }

    if (b.bank_account_hash) {
      if (!bankClusters.has(b.bank_account_hash)) {
        bankClusters.set(b.bank_account_hash, []);
      }
      bankClusters.get(b.bank_account_hash).push(b);
    }
  }

  for (const [phoneNorm, cluster] of phoneClusters.entries()) {
    const members = cluster.members;
    if (members.length < 2) continue;

    const familyGroups = [];
    for (const m of members) {
      const gNorm = normalizeText(m.guardian || m.guardian_name || '');
      const aNorm = normalizeText(m.address || '');

      let added = false;
      for (const fam of familyGroups) {
        const matchesFamGuardian = gNorm && fam.guardians.has(gNorm);
        const matchesFamAddress = aNorm && fam.addresses.has(aNorm);
        if (matchesFamGuardian || matchesFamAddress) {
          fam.members.push(m);
          if (gNorm) fam.guardians.add(gNorm);
          if (aNorm) fam.addresses.add(aNorm);
          added = true;
          break;
        }
      }

      if (!added) {
        familyGroups.push({
          guardians: new Set(gNorm ? [gNorm] : []),
          addresses: new Set(aNorm ? [aNorm] : []),
          members: [m]
        });
      }
    }

    if (familyGroups.length < (r6Config.minUnrelatedBeneficiaries || 2)) {
      continue;
    }

    const totalUnrelatedBeneficiaries = members.length;
    const isHigh = familyGroups.length >= 3 || totalUnrelatedBeneficiaries >= 4;

    findings.push({
      id: `finding_r6_phone_${phoneNorm.substring(6)}_${Date.now()}`,
      ruleId: 'RULE_6_REPEATED_CONTACT',
      ruleName: 'Shared Contact Across Unrelated Beneficiaries',
      category: 'risk_indicator',
      severity: isHigh ? 'high' : 'medium',
      entityType: 'beneficiary',
      entityId: members.map(m => m.id).join(', '),
      entityName: `${familyGroups.length} Unrelated Families (${totalUnrelatedBeneficiaries} Beneficiaries)`,
      title: `Phone ${cluster.info.masked} Shared by ${familyGroups.length} Unrelated Families`,
      description: `Mobile number ${cluster.info.masked} is registered to ${totalUnrelatedBeneficiaries} beneficiaries spanning ${familyGroups.length} distinct unrelated families (different guardian names and addresses).`,
      evidence: {
        maskedPhone: cluster.info.masked,
        phoneKeyedHash: cluster.info.hash,
        totalBeneficiaries: totalUnrelatedBeneficiaries,
        unrelatedFamilyGroupsCount: familyGroups.length,
        beneficiaryIds: members.map(m => m.id),
        beneficiaries: members.map(m => ({ id: m.id, name: m.name, guardian: m.guardian, address: m.address }))
      },
      legitimateFilterApplied: 'Sibling / same-guardian family clusters separated and excluded',
      timestamp: new Date().toISOString()
    });
  }

  for (const [bankHash, members] of bankClusters.entries()) {
    if (members.length >= 2) {
      findings.push({
        id: `finding_r6_bank_${bankHash.substring(0, 8)}_${Date.now()}`,
        ruleId: 'RULE_6_REPEATED_CONTACT',
        ruleName: 'Shared Bank Account Hash',
        category: 'risk_indicator',
        severity: 'high',
        entityType: 'beneficiary',
        entityId: members.map(m => m.id).join(', '),
        entityName: `${members.length} Beneficiaries`,
        title: `Identical Bank Account Hash Linked to ${members.length} Beneficiaries`,
        description: `Same financial account hash is linked to ${members.length} distinct beneficiary records, representing a strong fraud diversion signal.`,
        evidence: {
          bankAccountKeyedHash: bankHash,
          beneficiaryIds: members.map(m => m.id),
          beneficiaries: members.map(m => ({ id: m.id, name: m.name, guardian: m.guardian }))
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  return findings;
}

/**
 * =========================================================================
 * RULE 7: Impossible or Inconsistent Dates
 * =========================================================================
 */
export function checkRule7InconsistentDates(beneficiaries = [], enrollments = [], verifications = [], claims = [], config = DEFAULT_SCHEME_CONFIG) {
  const findings = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const ageRange = config.ageRange || { min: 5, max: 25 };

  const benMap = new Map((beneficiaries || []).map(b => [b.id, b]));

  for (const b of beneficiaries) {
    if (!b.date_of_birth && !b.dob) {
      findings.push({
        id: `finding_r7_missing_dob_${b.id}`,
        ruleId: 'RULE_7_INCONSISTENT_DATES',
        ruleName: 'Missing Date of Birth',
        category: 'data_quality',
        severity: 'low',
        entityType: 'beneficiary',
        entityId: b.id,
        entityName: b.name,
        title: `Missing Date of Birth for ${b.name}`,
        description: `Beneficiary record is missing date of birth field.`,
        evidence: { beneficiaryId: b.id },
        timestamp: new Date().toISOString()
      });
      continue;
    }

    const dob = normalizeDate(b.date_of_birth || b.dob);
    if (!dob) {
      findings.push({
        id: `finding_r7_invalid_dob_${b.id}`,
        ruleId: 'RULE_7_INCONSISTENT_DATES',
        ruleName: 'Unparseable Date of Birth Format',
        category: 'data_quality',
        severity: 'low',
        entityType: 'beneficiary',
        entityId: b.id,
        entityName: b.name,
        title: `Unparseable DOB: '${b.date_of_birth || b.dob}'`,
        description: `Date of birth cannot be parsed into standard calendar date.`,
        evidence: { rawDob: b.date_of_birth || b.dob },
        timestamp: new Date().toISOString()
      });
      continue;
    }

    if (dob > todayStr) {
      findings.push({
        id: `finding_r7_future_dob_${b.id}`,
        ruleId: 'RULE_7_INCONSISTENT_DATES',
        ruleName: 'Date of Birth in the Future',
        category: 'data_quality',
        severity: 'low',
        entityType: 'beneficiary',
        entityId: b.id,
        entityName: b.name,
        title: `Future Date of Birth (${dob})`,
        description: `Beneficiary has date of birth '${dob}' set in the future. Typical typing mistake.`,
        evidence: { dob, currentDate: todayStr },
        timestamp: new Date().toISOString()
      });
    }
  }

  const enrollmentsByBen = new Map();

  for (const enr of enrollments) {
    if (!enr.beneficiary_id) continue;
    const bId = enr.beneficiary_id;
    if (!enrollmentsByBen.has(bId)) enrollmentsByBen.set(bId, []);
    enrollmentsByBen.get(bId).push(enr);

    const start = normalizeDate(enr.start_date || enr.start);
    const end = normalizeDate(enr.end_date || enr.end);
    const ben = benMap.get(bId);

    if (start && end && end < start) {
      findings.push({
        id: `finding_r7_end_before_start_${enr.id}`,
        ruleId: 'RULE_7_INCONSISTENT_DATES',
        ruleName: 'Enrollment End Date Before Start Date',
        category: 'data_quality',
        severity: 'low',
        entityType: 'beneficiary',
        entityId: bId,
        entityName: ben ? ben.name : `Beneficiary ${bId}`,
        title: `Enrollment Ends (${end}) Before It Starts (${start})`,
        description: `Enrollment interval has end date preceding start date.`,
        evidence: { enrollmentId: enr.id, start, end },
        timestamp: new Date().toISOString()
      });
    }

    if (start && start > todayStr) {
      findings.push({
        id: `finding_r7_future_enr_${enr.id}`,
        ruleId: 'RULE_7_INCONSISTENT_DATES',
        ruleName: 'Enrollment Start Date in the Future',
        category: 'data_quality',
        severity: 'low',
        entityType: 'beneficiary',
        entityId: bId,
        entityName: ben ? ben.name : `Beneficiary ${bId}`,
        title: `Future Enrollment Date (${start})`,
        description: `Enrollment start date is set in the future.`,
        evidence: { enrollmentId: enr.id, start, currentDate: todayStr },
        timestamp: new Date().toISOString()
      });
    }

    if (ben && ben.date_of_birth && start) {
      const ageAtEnr = calculateAge(ben.date_of_birth, start);
      if (ageAtEnr !== null && (ageAtEnr < ageRange.min || ageAtEnr > ageRange.max)) {
        findings.push({
          id: `finding_r7_age_range_${enr.id}`,
          ruleId: 'RULE_7_INCONSISTENT_DATES',
          ruleName: 'Age at Enrollment Outside Scheme Bounds',
          category: 'data_quality',
          severity: 'low',
          entityType: 'beneficiary',
          entityId: bId,
          entityName: ben.name,
          title: `Age at Enrollment (${ageAtEnr} yrs) Outside Bounds [${ageRange.min}-${ageRange.max}]`,
          description: `Beneficiary was ${ageAtEnr} years old on enrollment date ${start}, outside the scheme eligibility bracket (${ageRange.min} to ${ageRange.max} years).`,
          evidence: { enrollmentId: enr.id, dob: ben.date_of_birth, enrollmentDate: start, calculatedAge: ageAtEnr, allowedRange: ageRange },
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  for (const [bId, enrs] of enrollmentsByBen.entries()) {
    if (enrs.length < 2) continue;
    const ben = benMap.get(bId);

    for (let i = 0; i < enrs.length; i++) {
      for (let j = i + 1; j < enrs.length; j++) {
        const e1 = enrs[i];
        const e2 = enrs[j];

        if (e1.unit_id === e2.unit_id) continue;

        const s1 = normalizeDate(e1.start_date || e1.start);
        const e1End = normalizeDate(e1.end_date || e1.end) || '9999-12-31';

        const s2 = normalizeDate(e2.start_date || e2.start);
        const e2End = normalizeDate(e2.end_date || e2.end) || '9999-12-31';

        if (!s1 || !s2) continue;

        if (s1 <= e2End && s2 <= e1End) {
          findings.push({
            id: `finding_r7_concurrent_${bId}_${e1.id}_${e2.id}`,
            ruleId: 'RULE_7_INCONSISTENT_DATES',
            ruleName: 'Concurrent Overlapping Enrollments Across Units',
            category: 'risk_indicator',
            severity: 'high',
            entityType: 'beneficiary',
            entityId: bId,
            entityName: ben ? ben.name : `Beneficiary ${bId}`,
            title: `Concurrent Overlapping Enrollments in Unit '${e1.unit_id}' and '${e2.unit_id}'`,
            description: `Beneficiary has simultaneous active enrollment periods in two distinct institutional units. Indicates possible dual enrollment or unrecorded transfer.`,
            evidence: {
              enrollment1: { id: e1.id, unit: e1.unit_id, start: s1, end: e1End },
              enrollment2: { id: e2.id, unit: e2.unit_id, start: s2, end: e2End }
            },
            legitimateFilterApplied: 'Clean re-enrollment after exit allowed; simultaneous overlap flagged',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  for (const v of verifications) {
    if (!v.beneficiary_id || !v.date) continue;
    const bId = v.beneficiary_id;
    const vDate = normalizeDate(v.date);
    const userEnrs = enrollmentsByBen.get(bId) || [];
    if (userEnrs.length === 0) continue;

    const earliestEnrStart = userEnrs
      .map(e => normalizeDate(e.start_date || e.start))
      .filter(Boolean)
      .sort()[0];

    if (earliestEnrStart && vDate && daysBetween(vDate, earliestEnrStart) > 60) {
      const ben = benMap.get(bId);
      findings.push({
        id: `finding_r7_verif_before_enr_${v.id}`,
        ruleId: 'RULE_7_INCONSISTENT_DATES',
        ruleName: 'Verification Event Substantially Precedes Enrollment',
        category: 'data_quality',
        severity: 'low',
        entityType: 'beneficiary',
        entityId: bId,
        entityName: ben ? ben.name : `Beneficiary ${bId}`,
        title: `Verification (${vDate}) Occurred ${daysBetween(vDate, earliestEnrStart)} Days Before Enrollment (${earliestEnrStart})`,
        description: `Verification record is timestamped months prior to the earliest enrollment start date.`,
        evidence: { verificationId: v.id, verificationDate: vDate, earliestEnrollmentDate: earliestEnrStart },
        timestamp: new Date().toISOString()
      });
    }
  }

  return findings;
}

/**
 * =========================================================================
 * RULE 8: Unusually Frequent Transfers
 * =========================================================================
 */
export function checkRule8FrequentTransfers(transfers = [], claims = [], beneficiaries = [], config = DEFAULT_SCHEME_CONFIG) {
  const findings = [];
  const r8Config = { ...DEFAULT_SCHEME_CONFIG.rule8, ...(config.rule8 || {}) };
  const academicMonths = new Set(r8Config.academicMonths || [3, 4, 6]);
  const allowedReasons = new Set((r8Config.allowedReasons || []).map(r => r.toUpperCase()));

  const benMap = new Map((beneficiaries || []).map(b => [b.id, b]));

  const transfersByBen = new Map();
  for (const t of transfers) {
    if (!t.beneficiary_id) continue;
    const bId = t.beneficiary_id;
    if (!transfersByBen.has(bId)) transfersByBen.set(bId, []);
    transfersByBen.get(bId).push({
      ...t,
      date: normalizeDate(t.date || t.transfer_date),
      reason: (t.reason || '').toUpperCase()
    });
  }

  const claimsByBen = new Map();
  for (const c of claims) {
    if (!c.beneficiary_id) continue;
    const bId = c.beneficiary_id;
    if (!claimsByBen.has(bId)) claimsByBen.set(bId, []);
    claimsByBen.get(bId).push(c);
  }

  for (const [bId, tList] of transfersByBen.entries()) {
    if (tList.length === 0) continue;
    const ben = benMap.get(bId);

    const nonRoutineTransfers = tList.filter(t => {
      if (!t.date) return true;
      const d = new Date(t.date);
      const month = d.getMonth() + 1;
      const isAcademicMonth = academicMonths.has(month);
      const isAllowedReason = allowedReasons.has(t.reason);
      return !(isAcademicMonth && isAllowedReason);
    });

    nonRoutineTransfers.sort((a, b) => new Date(a.date) - new Date(b.date));

    let maxCluster = [];
    for (let i = 0; i < nonRoutineTransfers.length; i++) {
      const startD = new Date(nonRoutineTransfers[i].date);
      const windowItems = [];
      for (let j = i; j < nonRoutineTransfers.length; j++) {
        const endD = new Date(nonRoutineTransfers[j].date);
        const diff = (endD - startD) / (1000 * 60 * 60 * 24);
        if (diff <= r8Config.windowDays) {
          windowItems.push(nonRoutineTransfers[j]);
        } else {
          break;
        }
      }
      if (windowItems.length > maxCluster.length) {
        maxCluster = windowItems;
      }
    }

    const shortStayPairs = [];
    for (let i = 0; i < nonRoutineTransfers.length - 1; i++) {
      const stayDays = daysBetween(nonRoutineTransfers[i].date, nonRoutineTransfers[i + 1].date);
      if (stayDays !== null && stayDays < r8Config.minStayDays) {
        shortStayPairs.push({
          t1: nonRoutineTransfers[i],
          t2: nonRoutineTransfers[i + 1],
          stayDays
        });
      }
    }

    const pingPongInstances = [];
    for (let i = 0; i < nonRoutineTransfers.length - 1; i++) {
      const t1 = nonRoutineTransfers[i];
      for (let j = i + 1; j < nonRoutineTransfers.length; j++) {
        const t2 = nonRoutineTransfers[j];
        if (t1.from_unit_id === t2.to_unit_id && t1.to_unit_id === t2.from_unit_id) {
          const diff = daysBetween(t1.date, t2.date);
          if (diff !== null && diff <= r8Config.pingPongDays) {
            pingPongInstances.push({ t1, t2, days: diff });
          }
        }
      }
    }

    const hasFrequencyViolation = maxCluster.length >= r8Config.maxTransfersInWindow;
    const hasShortStay = shortStayPairs.length > 0;
    const hasPingPong = pingPongInstances.length > 0;

    if (hasFrequencyViolation || hasShortStay || hasPingPong) {
      const userClaims = claimsByBen.get(bId) || [];
      let hasDualInstitutionClaim = false;
      if (userClaims.length >= 2) {
        const unitsWithClaims = new Set(userClaims.map(c => c.unit_id).filter(Boolean));
        hasDualInstitutionClaim = unitsWithClaims.size >= 2;
      }

      const isHigh = hasPingPong || hasDualInstitutionClaim || maxCluster.length >= 4;

      const triggers = [];
      if (hasFrequencyViolation) triggers.push(`${maxCluster.length} transfers in ${r8Config.windowDays} days`);
      if (hasShortStay) triggers.push(`Short stay of ${shortStayPairs[0].stayDays} days between moves`);
      if (hasPingPong) triggers.push(`Ping-pong transfer returned to origin unit in ${pingPongInstances[0].days} days`);
      if (hasDualInstitutionClaim) triggers.push('Concurrent claims from both institutions during transfer period');

      findings.push({
        id: `finding_r8_transfer_${bId}_${Date.now()}`,
        ruleId: 'RULE_8_FREQUENT_TRANSFERS',
        ruleName: 'Unusually Frequent or Rapid Transfers',
        category: 'risk_indicator',
        severity: isHigh ? 'high' : 'medium',
        entityType: 'beneficiary',
        entityId: bId,
        entityName: ben ? ben.name : `Beneficiary ${bId}`,
        title: `Abnormal Transfer Pattern: ${triggers[0]}`,
        description: `Beneficiary transfer history shows irregular mobility: ${triggers.join('; ')}.`,
        evidence: {
          totalTransfers: tList.length,
          triggers,
          maxTransfersInWindow: maxCluster.length,
          shortStays: shortStayPairs.map(p => ({ from: p.t1.to_unit_id, to: p.t2.to_unit_id, stayDays: p.stayDays })),
          pingPongMoves: pingPongInstances.map(p => ({ unitA: p.t1.from_unit_id, unitB: p.t1.to_unit_id, returnDays: p.days })),
          dualInstitutionClaimsFound: hasDualInstitutionClaim,
          transferHistory: tList.map(t => `${t.from_unit_id} -> ${t.to_unit_id} on ${t.date} (${t.reason || 'None'})`)
        },
        legitimateFilterApplied: 'Single annual academic rollover transfers excluded',
        timestamp: new Date().toISOString()
      });
    }
  }

  return findings;
}

/**
 * =========================================================================
 * Unified Module Entry Point: analyzeDataIntegrity
 * =========================================================================
 */
export function analyzeDataIntegrity(payload = {}) {
  const {
    beneficiaries = [],
    enrollments = [],
    verifications = [],
    claims = [],
    transfers = [],
    units = [],
    config = {}
  } = payload;

  const mergedConfig = {
    ...DEFAULT_SCHEME_CONFIG,
    ...config,
    rule2: { ...DEFAULT_SCHEME_CONFIG.rule2, ...(config.rule2 || {}) },
    rule3: { ...DEFAULT_SCHEME_CONFIG.rule3, ...(config.rule3 || {}) },
    rule4: { ...DEFAULT_SCHEME_CONFIG.rule4, ...(config.rule4 || {}) },
    rule5: { ...DEFAULT_SCHEME_CONFIG.rule5, ...(config.rule5 || {}) },
    rule6: { ...DEFAULT_SCHEME_CONFIG.rule6, ...(config.rule6 || {}) },
    rule7: { ...DEFAULT_SCHEME_CONFIG.rule7, ...(config.rule7 || {}) },
    rule8: { ...DEFAULT_SCHEME_CONFIG.rule8, ...(config.rule8 || {}) }
  };

  const allFindings = [];
  const rulesExecuted = [];

  if (verifications && verifications.length > 0) {
    const r2Findings = checkRule2RepeatedFailedVerification(verifications, beneficiaries, mergedConfig);
    allFindings.push(...r2Findings);
    rulesExecuted.push({ ruleId: 'RULE_2_REPEATED_FAILED_VERIFICATION', name: 'Repeated Failed Verification', findingsCount: r2Findings.length });
  }

  if (claims && claims.length > 0 && enrollments && enrollments.length > 0) {
    const r3Findings = checkRule3InactiveBeneficiaryClaim(claims, enrollments, beneficiaries, mergedConfig);
    allFindings.push(...r3Findings);
    rulesExecuted.push({ ruleId: 'RULE_3_INACTIVE_BENEFICIARY_CLAIM', name: 'Inactive Beneficiary Receiving Benefits', findingsCount: r3Findings.length });
  }

  if (enrollments && enrollments.length > 0 && beneficiaries && beneficiaries.length > 0) {
    const r4Findings = checkRule4UnusualDistribution(beneficiaries, enrollments, units, mergedConfig);
    allFindings.push(...r4Findings);
    rulesExecuted.push({ ruleId: 'RULE_4_UNUSUAL_DISTRIBUTION', name: 'Unusual Beneficiary Distribution', findingsCount: r4Findings.length });
  }

  if (beneficiaries && beneficiaries.length > 0) {
    const r5Findings = checkRule5SimilarRecords(beneficiaries, mergedConfig);
    allFindings.push(...r5Findings);
    rulesExecuted.push({ ruleId: 'RULE_5_SIMILAR_RECORDS', name: 'Suspiciously Similar Records', findingsCount: r5Findings.length });
  }

  if (beneficiaries && beneficiaries.length > 0) {
    const r6Findings = checkRule6RepeatedContact(beneficiaries, mergedConfig);
    allFindings.push(...r6Findings);
    rulesExecuted.push({ ruleId: 'RULE_6_REPEATED_CONTACT', name: 'Repeated Contact Details', findingsCount: r6Findings.length });
  }

  if ((beneficiaries && beneficiaries.length > 0) || (enrollments && enrollments.length > 0)) {
    const r7Findings = checkRule7InconsistentDates(beneficiaries, enrollments, verifications, claims, mergedConfig);
    allFindings.push(...r7Findings);
    rulesExecuted.push({ ruleId: 'RULE_7_INCONSISTENT_DATES', name: 'Impossible or Inconsistent Dates', findingsCount: r7Findings.length });
  }

  if (transfers && transfers.length > 0) {
    const r8Findings = checkRule8FrequentTransfers(transfers, claims, beneficiaries, mergedConfig);
    allFindings.push(...r8Findings);
    rulesExecuted.push({ ruleId: 'RULE_8_FREQUENT_TRANSFERS', name: 'Unusually Frequent Transfers', findingsCount: r8Findings.length });
  }

  const riskIndicators = allFindings.filter(f => f.category === 'risk_indicator');
  const dataQualityFindings = allFindings.filter(f => f.category === 'data_quality');
  const highSeverity = allFindings.filter(f => f.severity === 'high');
  const mediumSeverity = allFindings.filter(f => f.severity === 'medium');
  const lowSeverity = allFindings.filter(f => f.severity === 'low');

  const totalAmountAtRisk = allFindings.reduce((acc, f) => acc + (f.evidence?.totalAmountAtRisk || 0), 0);

  return {
    summary: {
      totalFindings: allFindings.length,
      riskIndicatorsCount: riskIndicators.length,
      dataQualityCount: dataQualityFindings.length,
      highSeverityCount: highSeverity.length,
      mediumSeverityCount: mediumSeverity.length,
      lowSeverityCount: lowSeverity.length,
      totalAmountAtRisk,
      rulesExecutedCount: rulesExecuted.length
    },
    rulesExecuted,
    findings: allFindings
  };
}

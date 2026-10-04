import { db } from '../db.js';

export const RULE_DEFINITIONS = {
  VERIFICATION_RATIO_LOW: {
    code: 'VERIFICATION_RATIO_LOW',
    name: 'Verification Ratio Low',
    defaultSeverity: 'medium',
    description: 'Verified face count is significantly lower than claimed attendance.'
  },
  TICKED_MORE_THAN_FACES_REPEATEDLY: {
    code: 'TICKED_MORE_THAN_FACES_REPEATEDLY',
    name: 'Repeated Over-Claiming',
    defaultSeverity: 'high',
    description: 'Consistent pattern of ticking more names than verified faces over multiple sessions.'
  },
  LONG_ABSENCE: {
    code: 'LONG_ABSENCE',
    name: 'Prolonged Unexplained Absence',
    defaultSeverity: 'high',
    description: 'Participant absent for extended period without a registered justification.'
  },
  LONG_ABSENCE_WITH_REASON: {
    code: 'LONG_ABSENCE_WITH_REASON',
    name: 'Extended Absence (Excused)',
    defaultSeverity: 'low',
    description: 'Participant on extended leave with documented official reason.'
  },
  NEVER_VERIFIED: {
    code: 'NEVER_VERIFIED',
    name: 'Unverified Register Ticks',
    defaultSeverity: 'high',
    description: 'Participant frequently marked present but in sessions with low overall photo verification confidence.'
  },
  IDENTICAL_COUNTS: {
    code: 'IDENTICAL_COUNTS',
    name: 'Suspiciously Identical Counts',
    defaultSeverity: 'medium',
    description: 'Same exact attendance number submitted consecutively for multiple days (copy-paste pattern).'
  },
  ALWAYS_FULL: {
    code: 'ALWAYS_FULL',
    name: 'Implausible 100% Occupancy',
    defaultSeverity: 'medium',
    description: 'Attendance maintained at 98-100% unbroken for an extended period.'
  },
  OVER_SANCTION: {
    code: 'OVER_SANCTION',
    name: 'Over Sanction Strength',
    defaultSeverity: 'high',
    description: 'Ticked attendance exceeds the legally sanctioned capacity of the unit.'
  },
  POOR_PHOTO_QUALITY_REPEATED: {
    code: 'POOR_PHOTO_QUALITY_REPEATED',
    name: 'Repeated Low Quality Photos',
    defaultSeverity: 'low',
    description: 'Multiple attempts with blurry, dark or substandard photos.'
  },
  DUPLICATE_PHOTO: {
    code: 'DUPLICATE_PHOTO',
    name: 'Duplicate Image Detected',
    defaultSeverity: 'high',
    description: 'Image hash matches a photo submitted in a previous session or day.'
  },
  OFF_SITE_PHOTO: {
    code: 'OFF_SITE_PHOTO',
    name: 'Off-Site Geofence Breach',
    defaultSeverity: 'high',
    description: 'Attendance photo captured outside the designated GPS geofence.'
  },
  SESSION_OUTSIDE_WINDOW: {
    code: 'SESSION_OUTSIDE_WINDOW',
    name: 'Session Time Window Violation',
    defaultSeverity: 'medium',
    description: 'Photos in session span beyond the allowable 15-minute window.'
  }
};

/**
 * Executes all rules for a given unit and current finalized session.
 */
export async function runRulesForSession(unitId, session) {
  const alertsCreated = [];
  const unit = db.findById('units', unitId);
  if (!unit) return alertsCreated;

  const pastSessions = db.find('sessions', { unitId, status: 'final' })
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  // Helper to record an alert
  function raiseAlert(ruleCode, severity, message, metadata = {}) {
    const existing = db.findOne('alerts', {
      unitId,
      sessionId: session.id,
      ruleCode,
      status: 'active'
    });
    if (!existing) {
      const alert = db.insert('alerts', {
        unitId,
        unitName: unit.name,
        sessionId: session.id,
        ruleCode,
        ruleName: RULE_DEFINITIONS[ruleCode]?.name || ruleCode,
        severity,
        message,
        metadata,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      alertsCreated.push(alert);
    }
  }

  // 1. RULE: VERIFICATION_RATIO_LOW
  // Ratio = verified faces / ticked names
  if (session.tickedCount > 0) {
    const ratio = session.verificationRatio;
    const minThreshold = unit.minVerificationRatio || 0.8;
    if (ratio < minThreshold) {
      const severity = ratio < 0.6 ? 'high' : 'medium';
      raiseAlert(
        'VERIFICATION_RATIO_LOW',
        severity,
        `Verification ratio is ${Math.round(ratio * 100)}% (${session.faceCount} faces detected vs ${session.tickedCount} ticked). Below required threshold of ${Math.round(minThreshold * 100)}%.`,
        { faceCount: session.faceCount, tickedCount: session.tickedCount, ratio }
      );
    }
  }

  // 2. RULE: OVER_SANCTION
  if (unit.sanctionedStrength && session.tickedCount > unit.sanctionedStrength) {
    raiseAlert(
      'OVER_SANCTION',
      'high',
      `Ticked count (${session.tickedCount}) exceeds sanctioned capacity (${unit.sanctionedStrength}) by ${session.tickedCount - unit.sanctionedStrength}.`,
      { tickedCount: session.tickedCount, sanctionedStrength: unit.sanctionedStrength }
    );
  }

  // 3. RULE: TICKED_MORE_THAN_FACES_REPEATEDLY
  // Check last 3-5 sessions
  const recent3 = pastSessions.slice(0, 3);
  if (recent3.length >= 3) {
    const allLow = recent3.every(s => (s.verificationRatio || 0) < 0.8);
    if (allLow) {
      raiseAlert(
        'TICKED_MORE_THAN_FACES_REPEATEDLY',
        'high',
        `Unit has recorded low face verification ratios for ${recent3.length} consecutive sessions. High fraud likelihood.`,
        { recentRatios: recent3.map(s => s.verificationRatio) }
      );
    }
  }

  // 4. RULE: IDENTICAL_COUNTS
  // Same ticked count for 4+ consecutive sessions
  const recent5 = pastSessions.slice(0, 5);
  if (recent5.length >= 4) {
    const firstCount = recent5[0].tickedCount;
    const allSame = recent5.every(s => s.tickedCount === firstCount && s.tickedCount > 0);
    if (allSame) {
      raiseAlert(
        'IDENTICAL_COUNTS',
        'medium',
        `Exactly ${firstCount} attendees claimed for ${recent5.length} consecutive sessions in a row. Suggests copied or fabricated register.`,
        { count: firstCount, consecutiveSessions: recent5.length }
      );
    }
  }

  // 5. RULE: ALWAYS_FULL
  // Attendance rate >= 98% across past 7 sessions
  const recent7 = pastSessions.slice(0, 7);
  if (recent7.length >= 7) {
    const alwaysFull = recent7.every(s => (s.attendanceRate || 0) >= 0.98);
    if (alwaysFull) {
      raiseAlert(
        'ALWAYS_FULL',
        'medium',
        `Attendance reported at 98-100% across ${recent7.length} consecutive sessions without normal statistical fluctuation.`,
        { consecutiveFullSessions: recent7.length }
      );
    }
  }

  // 6. RULE: SESSION_OUTSIDE_WINDOW
  if (session.photos && session.photos.length > 1) {
    const timestamps = session.photos.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
    if (timestamps.length >= 2) {
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const durationMins = (maxTime - minTime) / (1000 * 60);
      if (durationMins > 15) {
        raiseAlert(
          'SESSION_OUTSIDE_WINDOW',
          'medium',
          `Session photos were captured across ${Math.round(durationMins)} minutes, exceeding the maximum allowable window of 15 minutes.`,
          { durationMins: Math.round(durationMins) }
        );
      }
    }
  }

  return alertsCreated;
}

/**
 * Daily participant long absence check job.
 */
export function runDailyParticipantAbsenceJob() {
  const participants = db.find('participants', { status: 'active' });
  const alerts = [];

  for (const p of participants) {
    const absentDays = p.consecutiveAbsentDays || 0;
    const unit = db.findById('units', p.unitId);

    if (absentDays >= 15) {
      if (p.absenceReason) {
        alerts.push(db.insert('alerts', {
          unitId: p.unitId,
          unitName: unit ? unit.name : 'Unknown Unit',
          participantId: p.id,
          participantName: p.name,
          ruleCode: 'LONG_ABSENCE_WITH_REASON',
          ruleName: RULE_DEFINITIONS.LONG_ABSENCE_WITH_REASON.name,
          severity: 'low',
          message: `Participant ${p.name} (Roll: ${p.rollNo || p.id}) absent for ${absentDays} consecutive days. Registered Reason: ${p.absenceReason}`,
          metadata: { absentDays, reason: p.absenceReason },
          status: 'active',
          createdAt: new Date().toISOString()
        }));
      } else {
        alerts.push(db.insert('alerts', {
          unitId: p.unitId,
          unitName: unit ? unit.name : 'Unknown Unit',
          participantId: p.id,
          participantName: p.name,
          ruleCode: 'LONG_ABSENCE',
          ruleName: RULE_DEFINITIONS.LONG_ABSENCE.name,
          severity: 'high',
          message: `Participant ${p.name} (Roll: ${p.rollNo || p.id}) absent for ${absentDays} consecutive days without any recorded justification. Needs immediate field verification.`,
          metadata: { absentDays },
          status: 'active',
          createdAt: new Date().toISOString()
        }));
      }
    }
  }
  return alerts;
}

/**
 * Computes weekly aggregate metrics & fraud indicators for a unit.
 */
export function computeUnitMetrics(unitId) {
  const sessions = db.find('sessions', { unitId, status: 'final' });
  const participants = db.find('participants', { unitId, status: 'active' });

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      avgVerificationRatio: 0,
      stdDevAttendance: 0,
      longAbsenceRate: 0,
      riskScore: 0,
      riskLevel: 'LOW'
    };
  }

  // Average verification ratio
  const ratios = sessions.map(s => s.verificationRatio || 0);
  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;

  // Standard deviation of daily attendance
  const tickedCounts = sessions.map(s => s.tickedCount || 0);
  const meanCount = tickedCounts.reduce((a, b) => a + b, 0) / tickedCounts.length;
  const variance = tickedCounts.reduce((acc, val) => acc + Math.pow(val - meanCount, 2), 0) / tickedCounts.length;
  const stdDev = Math.sqrt(variance);

  // Long absence share
  const longAbsentees = participants.filter(p => (p.consecutiveAbsentDays || 0) >= 15).length;
  const longAbsenceRate = participants.length > 0 ? (longAbsentees / participants.length) : 0;

  // Active alerts count
  const activeAlerts = db.find('alerts', { unitId, status: 'active' });
  const highAlerts = activeAlerts.filter(a => a.severity === 'high').length;
  const medAlerts = activeAlerts.filter(a => a.severity === 'medium').length;

  // Composite Risk Score (0 - 100)
  let riskScore = 0;
  if (avgRatio < 0.6) riskScore += 40;
  else if (avgRatio < 0.8) riskScore += 20;

  if (stdDev < 0.5 && sessions.length >= 5) riskScore += 20; // Suspiciously invariant counts
  if (longAbsenceRate > 0.15) riskScore += 15;
  riskScore += (highAlerts * 15) + (medAlerts * 5);
  riskScore = Math.min(100, riskScore);

  let riskLevel = 'LOW';
  if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MEDIUM';

  return {
    totalSessions: sessions.length,
    avgVerificationRatio: Number(avgRatio.toFixed(2)),
    stdDevAttendance: Number(stdDev.toFixed(2)),
    longAbsenceCount: longAbsentees,
    longAbsenceRate: Number((longAbsenceRate * 100).toFixed(1)),
    activeAlertsCount: activeAlerts.length,
    highAlertsCount: highAlerts,
    riskScore,
    riskLevel
  };
}

import { db } from '../db.js';
import { computeUnitMetrics, runDailyParticipantAbsenceJob } from '../services/rulesEngine.js';

export function getUnits(req, res) {
  try {
    const units = db.find('units').map(u => {
      const metrics = computeUnitMetrics(u.id);
      const participantCount = db.count('participants', { unitId: u.id, status: 'active' });
      return {
        ...u,
        participantCount,
        metrics
      };
    });
    return res.json({ units });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function getUnitById(req, res) {
  try {
    const unit = db.findById('units', req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found.' });

    const metrics = computeUnitMetrics(unit.id);
    const participants = db.find('participants', { unitId: unit.id });
    const recentSessions = db.find('sessions', { unitId: unit.id })
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 10);
    const alerts = db.find('alerts', { unitId: unit.id, status: 'active' });

    return res.json({
      unit,
      metrics,
      participantCount: participants.length,
      participants,
      recentSessions,
      alerts
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function getParticipants(req, res) {
  try {
    const { unitId } = req.query;
    const query = {};
    if (unitId) query.unitId = unitId;

    const participants = db.find('participants', query);
    return res.json({ participants });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function updateParticipantReason(req, res) {
  try {
    const { id } = req.params;
    const { absenceReason } = req.body;

    const participant = db.findById('participants', id);
    if (!participant) return res.status(404).json({ error: 'Participant not found.' });

    const updated = db.update('participants', id, { absenceReason });

    // Update any active HIGH severity long absence alert to LOW
    const activeAlerts = db.find('alerts', { participantId: id, ruleCode: 'LONG_ABSENCE', status: 'active' });
    for (const a of activeAlerts) {
      db.update('alerts', a.id, {
        ruleCode: 'LONG_ABSENCE_WITH_REASON',
        ruleName: 'Extended Absence (Excused)',
        severity: 'low',
        message: `Participant ${participant.name} absent for ${participant.consecutiveAbsentDays} days. Reason recorded: ${absenceReason}`
      });
    }

    return res.json({ message: 'Absence reason updated successfully.', participant: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function getAlerts(req, res) {
  try {
    const { unitId, severity, status } = req.query;
    let alerts = db.find('alerts');

    if (unitId) alerts = alerts.filter(a => a.unitId === unitId);
    if (severity) alerts = alerts.filter(a => a.severity === severity);
    if (status) alerts = alerts.filter(a => a.status === status);

    alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ count: alerts.length, alerts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function updateAlert(req, res) {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const alert = db.findById('alerts', id);
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });

    const updated = db.update('alerts', id, {
      status: status || alert.status,
      resolutionNotes: resolutionNotes || alert.resolutionNotes || '',
      resolvedAt: status === 'resolved' ? new Date().toISOString() : alert.resolvedAt
    });

    return res.json({ message: 'Alert updated.', alert: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function getDashboardSummary(req, res) {
  try {
    const units = db.find('units');
    const sessions = db.find('sessions', { status: 'final' });
    const alerts = db.find('alerts', { status: 'active' });
    const participants = db.find('participants', { status: 'active' });

    const highAlerts = alerts.filter(a => a.severity === 'high');
    const mediumAlerts = alerts.filter(a => a.severity === 'medium');

    const totalRatios = sessions.map(s => s.verificationRatio || 0);
    const overallAvgRatio = totalRatios.length > 0
      ? Number((totalRatios.reduce((a, b) => a + b, 0) / totalRatios.length).toFixed(2))
      : 0;

    const highRiskUnits = units.filter(u => computeUnitMetrics(u.id).riskLevel === 'HIGH');

    return res.json({
      summary: {
        totalUnits: units.length,
        totalParticipants: participants.length,
        totalFinalizedSessions: sessions.length,
        activeAlerts: alerts.length,
        highSeverityAlerts: highAlerts.length,
        mediumSeverityAlerts: mediumAlerts.length,
        overallAvgVerificationRatio: overallAvgRatio,
        highRiskUnitsCount: highRiskUnits.length
      },
      highRiskUnits: highRiskUnits.map(u => ({ id: u.id, name: u.name, metrics: computeUnitMetrics(u.id) })),
      recentAlerts: alerts.slice(0, 10)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function triggerDailyJob(req, res) {
  try {
    const alerts = runDailyParticipantAbsenceJob();
    return res.json({ message: 'Daily absence job executed.', newAlertsCount: alerts.length, alerts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

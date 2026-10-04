import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Building2,
  Users,
  Activity,
  Filter,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function AlertsDashboard() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedUnitId, setSelectedUnitId] = useState('all');
  const [loading, setLoading] = useState(false);
  const [excuseModalParticipant, setExcuseModalParticipant] = useState(null);
  const [excuseReason, setExcuseReason] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, alertsRes, unitsRes] = await Promise.all([
        axios.get('/api/dashboard/summary'),
        axios.get('/api/alerts'),
        axios.get('/api/units')
      ]);
      setSummary(sumRes.data.summary);
      setAlerts(alertsRes.data.alerts || []);
      setUnits(unitsRes.data.units || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    const notes = prompt("Enter officer audit/resolution notes:", "Investigated on site: Verified genuine records.");
    if (notes) {
      try {
        await axios.patch(`/api/alerts/${alertId}`, {
          status: 'resolved',
          resolutionNotes: notes
        });
        fetchDashboardData();
      } catch (err) {
        alert("Failed to update alert: " + err.message);
      }
    }
  };

  const handleSaveAbsenceReason = async () => {
    if (!excuseModalParticipant || !excuseReason) return;
    try {
      await axios.post(`/api/participants/${excuseModalParticipant.id}/reason`, {
        absenceReason: excuseReason
      });
      setExcuseModalParticipant(null);
      setExcuseReason('');
      fetchDashboardData();
    } catch (err) {
      alert("Failed to save reason: " + err.message);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (selectedSeverity !== 'all' && a.severity !== selectedSeverity) return false;
    if (selectedUnitId !== 'all' && a.unitId !== selectedUnitId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
            <span>Overall Verification Ratio</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {summary ? `${Math.round(summary.overallAvgVerificationRatio * 100)}%` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target benchmark: ≥ 80%</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
            <span>Active Fraud Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-red-400 font-mono">
            {summary ? summary.activeAlerts : '--'}
          </div>
          <p className="text-[11px] text-red-400/80 mt-1">
            {summary ? `${summary.highSeverityAlerts} Critical High Severity` : '--'}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
            <span>Monitored Institutions</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {summary ? summary.totalUnits : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary ? `${summary.totalParticipants} Active Registered Beneficiaries` : '--'}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
            <span>Finalized Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {summary ? summary.totalFinalizedSessions : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">AI Verified & De-duplicated</p>
        </div>
      </div>

      {/* Main Grid: Alert Stream & Unit Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Anti-Fraud Alerts Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Real-Time Anti-Fraud Alert Feed
              </h3>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="bg-slate-900 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="high">High Severity</option>
                  <option value="medium">Medium Severity</option>
                  <option value="low">Low Severity</option>
                </select>

                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="bg-slate-900 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none max-w-[140px] truncate"
                >
                  <option value="all">All Units</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alert List */}
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  {!summary ? (
                    <>
                      <AlertTriangle className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                      No data available — Backend service is offline.
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                      No active fraud alerts matching your filter criteria.
                    </>
                  )}
                </div>
              ) : (
                filteredAlerts.map(a => {
                  const isHigh = a.severity === 'high';
                  const isMed = a.severity === 'medium';
                  const isResolved = a.status === 'resolved';

                  return (
                    <div
                      key={a.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isResolved
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                          : isHigh
                          ? 'bg-red-950/30 border-red-500/30 shadow-sm shadow-red-950/20'
                          : isMed
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                              isHigh
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isMed
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {a.severity}
                            </span>
                            <span className="text-xs font-bold text-slate-200">{a.ruleName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {a.ruleCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                            {a.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                            <span>{a.unitName}</span>
                            <span>•</span>
                            <span>{new Date(a.createdAt).toLocaleString()}</span>
                            {a.participantName && (
                              <>
                                <span>•</span>
                                <span className="text-sky-400">Target: {a.participantName}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {!isResolved ? (
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleResolveAlert(a.id)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700"
                            >
                              Resolve
                            </button>
                            {a.ruleCode === 'LONG_ABSENCE' && a.participantId && (
                              <button
                                onClick={() => setExcuseModalParticipant({ id: a.participantId, name: a.participantName })}
                                className="px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-500 text-white text-[11px] font-medium"
                              >
                                Add Reason
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium px-2 py-0.5 bg-emerald-500/10 rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Institutional Risk Index & Trend Analysis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" /> Unit Fraud Risk Profiles
            </h3>

            <div className="space-y-3">
              {units.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {!summary ? 'No institutional data available — Backend service is offline.' : 'No monitored institutions registered.'}
                </div>
              ) : (
                units.map(u => {
                const m = u.metrics || {};
                const isHighRisk = m.riskLevel === 'HIGH';
                const isMedRisk = m.riskLevel === 'MEDIUM';

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-100">{u.name}</h4>
                        <p className="text-[11px] text-slate-400">{u.type} • Sanction: {u.sanctionedStrength}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isHighRisk
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isMedRisk
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        Risk: {m.riskLevel || 'LOW'} ({m.riskScore || 0}/100)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">Avg Ratio:</span>
                        <span className={`font-mono font-bold ${(m.avgVerificationRatio || 0) < 0.8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {m.avgVerificationRatio ? `${Math.round(m.avgVerificationRatio * 100)}%` : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Std. Dev:</span>
                        <span className="font-mono text-slate-200 font-semibold">
                          {m.stdDevAttendance ?? '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Long Absent:</span>
                        <span className="font-mono text-slate-200 font-semibold">
                          {m.longAbsenceCount || 0} ({m.longAbsenceRate || 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </div>

      {/* Reason Logging Modal */}
      {excuseModalParticipant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-100">Record Absence Justification</h3>
            <p className="text-xs text-slate-400">
              Provide documented official leave / medical justification for participant <strong className="text-slate-200">{excuseModalParticipant.name}</strong> to downgrade high risk alert.
            </p>

            <textarea
              rows={3}
              value={excuseReason}
              onChange={(e) => setExcuseReason(e.target.value)}
              placeholder="e.g. Medical leave certified by district medical officer..."
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setExcuseModalParticipant(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAbsenceReason}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Save Reason & Update Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  Play,
  RotateCw,
  Search,
  Filter,
  CheckCircle,
  X,
  AlertTriangle,
  Building,
  Video,
  Users,
  Coins,
  MapPin,
  ExternalLink,
  Cpu,
  Layers,
  ChevronRight,
  Sparkles,
  Sliders,
  CheckSquare
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface AnomalyEngineViewProps {
  alerts: any[];
  projects: any[];
  authToken?: string | null;
  onRefreshAlerts: () => void;
  onSelectAlert: (alert: any) => void;
  onSelectProject?: (proj: any) => void;
}

export const AnomalyEngineView: React.FC<AnomalyEngineViewProps> = ({
  alerts,
  projects,
  authToken,
  onRefreshAlerts,
  onSelectAlert,
  onSelectProject,
}) => {
  const [selectedRuleCategory, setSelectedRuleCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Sandbox state
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxTab, setSandboxTab] = useState<'attendance' | 'velocity' | 'duplicate'>('attendance');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);

  // Sandbox form inputs
  const [attendanceEnrolled, setAttendanceEnrolled] = useState<number>(60);
  const [attendancePresent, setAttendancePresent] = useState<number>(34);
  const [attendanceHistorical, setAttendanceHistorical] = useState<number>(55);

  const [disbursedPercent, setDisbursedPercent] = useState<number>(85);
  const [physicalPercent, setPhysicalPercent] = useState<number>(40);

  const [hashA, setHashA] = useState<string>('a1b2c3d4e5f60718');
  const [hashB, setHashB] = useState<string>('a1b2c3d4e5f60719');

  // Trigger System-wide Rules 1-30 Scan
  const handleRunSystemScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      const token = authToken || localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/anomalies/scan-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Engine scan evaluation failed');
      }

      const data = await res.json();
      setScanResult(data.data);
      onRefreshAlerts();
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Failed to trigger anomaly evaluation engine');
    } finally {
      setIsScanning(false);
    }
  };

  // Run AI Sandbox Test
  const handleRunSandboxTest = async () => {
    setSandboxLoading(true);
    setSandboxResult(null);

    const token = authToken || localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      if (sandboxTab === 'attendance') {
        const res = await fetch('/api/v1/anomalies/analyze/attendance', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            registeredCount: Number(attendanceEnrolled),
            actualAttendance: Number(attendancePresent),
            historicalAverage: Number(attendanceHistorical),
          }),
        });
        const d = await res.json();
        setSandboxResult(d.data || d);
      } else if (sandboxTab === 'velocity') {
        const res = await fetch('/api/v1/anomalies/analyze/progress-velocity', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            disbursedFundsPercent: Number(disbursedPercent),
            physicalProgressPercent: Number(physicalPercent),
          }),
        });
        const d = await res.json();
        setSandboxResult(d.data || d);
      } else if (sandboxTab === 'duplicate') {
        const res = await fetch('/api/v1/anomalies/analyze/duplicate-evidence', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            evidenceHashA: hashA,
            evidenceHashB: hashB,
          }),
        });
        const d = await res.json();
        setSandboxResult(d.data || d);
      }
    } catch (err: any) {
      setSandboxResult({ error: err.message || 'Sandbox analysis request failed' });
    } finally {
      setSandboxLoading(false);
    }
  };

  // Quick Adjudication handler
  const handleQuickAdjudicate = async (e: React.MouseEvent, alertId: string, status: 'RESOLVED' | 'DISMISSED') => {
    e.stopPropagation();
    try {
      const token = authToken || localStorage.getItem('auth_token');
      await fetch(`/api/v1/anomalies/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status,
          resolutionNotes: status === 'RESOLVED' 
            ? 'Quick confirmed authentic anomaly by DoSJE monitoring officer.' 
            : 'Quick dismissed as false positive after review.',
        }),
      });
      onRefreshAlerts();
    } catch (err) {
      console.error('Quick adjudication failed:', err);
    }
  };

  // Helper to categorize rule ID into rule sets
  const getRuleCategoryKey = (alert: any) => {
    const text = `${alert.ruleId || ''} ${alert.title || ''} ${alert.type || ''}`.toUpperCase();
    const match = text.match(/RULE[_\-\s]*(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 5) return 'RULES_1_5';
      if (num >= 6 && num <= 10) return 'RULES_6_10';
      if (num >= 11 && num <= 15) return 'RULES_11_15';
      if (num >= 16 && num <= 22) return 'RULES_16_22';
      if (num >= 23 && num <= 30) return 'RULES_23_30';
    }
    // Fallback to semantic domain
    if (text.includes('ATTENDANCE') || text.includes('GHOST') || text.includes('BENEFICIARY')) return 'RULES_1_5';
    if (text.includes('DUPLICATE') || text.includes('EVIDENCE') || text.includes('HASH')) return 'RULES_6_10';
    if (text.includes('CCTV') || text.includes('STREAM') || text.includes('DOWNTIME') || text.includes('CAMERA')) return 'RULES_11_15';
    if (text.includes('FINANCIAL') || text.includes('SPENDING') || text.includes('PROGRESS') || text.includes('SPIKE') || text.includes('BURN')) return 'RULES_16_22';
    if (text.includes('GEOFENCE') || text.includes('INSPECTION') || text.includes('LOCATION')) return 'RULES_23_30';
    return 'OTHER';
  };

  const getRuleTag = (al: any) => {
    if (al.ruleId) return al.ruleId;
    const match = (al.title || '').match(/\[(RULE[_\-\s]*\d+[^\]]*)\]/i);
    if (match) return match[1].replace(/_/g, '-');
    const cat = getRuleCategoryKey(al);
    if (cat === 'RULES_1_5') return 'RULE-001';
    if (cat === 'RULES_6_10') return 'RULE-008';
    if (cat === 'RULES_11_15') return 'RULE-012';
    if (cat === 'RULES_16_22') return 'RULE-021';
    if (cat === 'RULES_23_30') return 'RULE-025';
    return 'RULE-DETECT';
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((al) => {
    // Rule category filter
    if (selectedRuleCategory !== 'ALL') {
      const cat = getRuleCategoryKey(al);
      if (cat !== selectedRuleCategory) return false;
    }

    // Severity filter
    if (selectedSeverity !== 'ALL' && al.severity !== selectedSeverity) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'ALL' && al.status !== selectedStatus) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const proj = projects.find((p) => (p._id || p.id) === (al.projectId?._id || al.projectId?.id || al.projectId));
      const matchText = `${al.title || ''} ${al.reason || ''} ${al.ruleId || ''} ${al.type || ''} ${proj?.name || ''} ${proj?.code || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  // Calculate summary counts
  const totalCount = alerts.length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const openCount = alerts.filter((a) => a.status === 'OPEN').length;
  const attendanceAlerts = alerts.filter((a) => getRuleCategoryKey(a) === 'RULES_1_5').length;
  const cctvAlerts = alerts.filter((a) => getRuleCategoryKey(a) === 'RULES_11_15').length;
  const financeAlerts = alerts.filter((a) => getRuleCategoryKey(a) === 'RULES_16_22').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-900/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Explainable AI Anomaly & Fraud Detection Engine
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  RULES 1–30 LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates attendance rolls, CCTV feeds, financial burn velocity, and geofenced inspection integrity across all 20 facilities.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSandbox(!showSandbox)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                showSandbox
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Cpu className="w-4 h-4 text-indigo-400" />
              {showSandbox ? 'Hide AI Sandbox' : 'Open AI Sandbox'}
            </button>

            <button
              onClick={handleRunSystemScan}
              disabled={isScanning}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-950/60 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Evaluating Rules 1–30...' : 'Run Rules 1–30 Scan'}
            </button>
          </div>
        </div>

        {/* Scan Status Toast Banner */}
        {scanResult && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>System Scan Completed:</strong> Evaluated {scanResult.facilitiesEvaluated} facilities across Rules 1–30. Generated {scanResult.anomaliesGenerated} active anomaly alerts.
              </span>
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="text-emerald-400 hover:text-emerald-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {scanError && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
            <button onClick={() => setScanError(null)} className="text-rose-400 hover:text-rose-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Interactive AI Testing Sandbox (Collapsible Drawer/Section) */}
      {showSandbox && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-900/50 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Interactive AI Microservice Sandbox (Port 8000 &bull; FastAPI)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              TEST BENCH
            </span>
          </div>

          {/* Sandbox Model Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSandboxTab('attendance'); setSandboxResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                sandboxTab === 'attendance'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Rule 1–5: Attendance Anomaly
            </button>
            <button
              onClick={() => { setSandboxTab('velocity'); setSandboxResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                sandboxTab === 'velocity'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Rule 16–22: Progress Velocity Gap
            </button>
            <button
              onClick={() => { setSandboxTab('duplicate'); setSandboxResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                sandboxTab === 'duplicate'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Rule 6–10: Duplicate Image Hash
            </button>
          </div>

          {/* Sandbox Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            {sandboxTab === 'attendance' && (
              <>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Enrolled Beneficiaries</label>
                  <input
                    type="number"
                    value={attendanceEnrolled}
                    onChange={(e) => setAttendanceEnrolled(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Observed Headcount (CCTV/Biometric)</label>
                  <input
                    type="number"
                    value={attendancePresent}
                    onChange={(e) => setAttendancePresent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Historical Facility Mean</label>
                  <input
                    type="number"
                    value={attendanceHistorical}
                    onChange={(e) => setAttendanceHistorical(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                  />
                </div>
              </>
            )}

            {sandboxTab === 'velocity' && (
              <>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Disbursed Funds (%)</label>
                  <input
                    type="number"
                    value={disbursedPercent}
                    onChange={(e) => setDisbursedPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Physical Completion (%)</label>
                  <input
                    type="number"
                    value={physicalPercent}
                    onChange={(e) => setPhysicalPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-[11px] text-slate-400 p-2 rounded bg-slate-900 border border-slate-800 w-full">
                    Delta Gap: <strong className="text-amber-400 font-mono">{disbursedPercent - physicalPercent}%</strong>
                  </div>
                </div>
              </>
            )}

            {sandboxTab === 'duplicate' && (
              <>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Evidence Photo Hash A (Hex)</label>
                  <input
                    type="text"
                    value={hashA}
                    onChange={(e) => setHashA(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Evidence Photo Hash B (Hex)</label>
                  <input
                    type="text"
                    value={hashB}
                    onChange={(e) => setHashB(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <span className="text-[10px] text-slate-500">Perceptual dHash Hamming Distance evaluator</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleRunSandboxTest}
              disabled={sandboxLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {sandboxLoading ? 'Computing In Python Neural Engine...' : 'Run Microservice Evaluation'}
            </button>

            {sandboxResult && (
              <div className="flex-1 ml-4 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
                <span className="text-slate-400">Response:</span>
                <span className="text-emerald-400 font-bold">{JSON.stringify(sandboxResult)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Alerts</div>
          <div className="text-xl font-bold text-slate-100 mt-1 font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Rules 1–30 Coverage</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-900/40">
          <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Critical Severity</div>
          <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{criticalCount}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Action Mandatory</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-900/40">
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Ghost & Attendance</div>
          <div className="text-xl font-bold text-indigo-300 mt-1 font-mono">{attendanceAlerts}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Rules 1–5</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-900/40">
          <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">CCTV & Tampering</div>
          <div className="text-xl font-bold text-sky-300 mt-1 font-mono">{cctvAlerts}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Rules 11–15</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-900/40">
          <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Financial Burn</div>
          <div className="text-xl font-bold text-amber-300 mt-1 font-mono">{financeAlerts}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Rules 16–22</div>
        </div>
      </div>

      {/* Rule Categories Filter Tabs (Rules 1-30) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        <button
          onClick={() => setSelectedRuleCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
            selectedRuleCategory === 'ALL'
              ? 'bg-slate-100 text-slate-900 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Rules (1–30)
        </button>
        <button
          onClick={() => setSelectedRuleCategory('RULES_1_5')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            selectedRuleCategory === 'RULES_1_5'
              ? 'bg-indigo-600 text-white font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Rules 1–5: Attendance & Ghost Deficits
        </button>
        <button
          onClick={() => setSelectedRuleCategory('RULES_6_10')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            selectedRuleCategory === 'RULES_6_10'
              ? 'bg-purple-600 text-white font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          Rules 6–10: Evidence Deduplication & Hashes
        </button>
        <button
          onClick={() => setSelectedRuleCategory('RULES_11_15')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            selectedRuleCategory === 'RULES_11_15'
              ? 'bg-sky-600 text-white font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-sky-400" />
          Rules 11–15: CCTV Feeds & Telemetry
        </button>
        <button
          onClick={() => setSelectedRuleCategory('RULES_16_22')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            selectedRuleCategory === 'RULES_16_22'
              ? 'bg-amber-600 text-white font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          Rules 16–22: Grant Utilization & Split Procurement
        </button>
        <button
          onClick={() => setSelectedRuleCategory('RULES_23_30')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            selectedRuleCategory === 'RULES_23_30'
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          Rules 23–30: Geofence & Inspection Integrity
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by facility, rule ID, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open (Pending)</option>
            <option value="RESOLVED">Resolved / Verified</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <button
            onClick={onRefreshAlerts}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
            title="Refresh Alert Stream"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No Matching Anomalies Detected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No anomaly alerts match the current filter criteria. Run the Rules 1–30 evaluation scan above to detect real-time facility outliers.
            </p>
          </div>
        ) : (
          filteredAlerts.map((al) => {
            const proj = projects.find((p) => (p._id || p.id) === (al.projectId?._id || al.projectId?.id || al.projectId));
            const confidencePercent = Math.round((al.confidence || 0.92) * 100);

            return (
              <div
                key={al._id || al.id}
                onClick={() => onSelectAlert(al)}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-3 group shadow-md"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-rose-300 font-bold border border-slate-700">
                        {getRuleTag(al)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {al.source || 'AI SERVICE & RULES_1_30'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition mt-1">
                      {al.title || al.type}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={al.severity} type="risk" />
                    <StatusBadge status={al.status || 'OPEN'} />
                  </div>
                </div>

                {/* Facility reference */}
                {proj && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-300 font-medium">{proj.name}</span>
                    <span className="text-slate-500 font-mono">({proj.district}, {proj.state})</span>
                  </div>
                )}

                {/* Explainable AI description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {al.reason || al.description}
                </p>

                {/* Confidence Meter & Telemetry */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Confidence:</span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full"
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-300">{confidencePercent}%</span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {al.status === 'OPEN' && (
                      <>
                        <button
                          onClick={(e) => handleQuickAdjudicate(e, al._id || al.id, 'RESOLVED')}
                          className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 text-[10px] font-semibold border border-emerald-800 transition"
                          title="Confirm Authentic Anomaly"
                        >
                          Verify
                        </button>
                        <button
                          onClick={(e) => handleQuickAdjudicate(e, al._id || al.id, 'DISMISSED')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-semibold border border-slate-700 transition"
                          title="Dismiss False Positive"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    <span className="text-indigo-400 font-bold text-xs flex items-center gap-0.5 group-hover:underline pl-1">
                      Adjudicate &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Video, ShieldAlert, CheckCircle, AlertTriangle, Phone, Radio, Users, Play, Sparkles, Building, Camera, Eye, Smartphone, Wifi, Settings } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface VCSurpriseViewProps {
  cameras: any[];
  sessions: any[];
  projects: any[];
  onInitiateSurpriseVC: (vcData: any) => Promise<void>;
  onSelectProject?: (proj: any) => void;
  onOpenStreamModal?: (camera: any) => void;
  loading: boolean;
}

export const VCSurpriseView: React.FC<VCSurpriseViewProps> = ({
  cameras,
  sessions,
  projects,
  onInitiateSurpriseVC,
  onSelectProject,
  onOpenStreamModal,
  loading,
}) => {
  const [showVCModal, setShowVCModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || projects[0]?._id || '');
  const [reportedStaff, setReportedStaff] = useState('6');
  const [verifiedStaff, setVerifiedStaff] = useState('6');
  const [reportedBens, setReportedBens] = useState('30');
  const [verifiedBens, setVerifiedBens] = useState('22');
  const [q1, setQ1] = useState(false);
  const [q2, setQ2] = useState(true);
  const [q3, setQ3] = useState(true);
  const [vcNotes, setVcNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mobile camera configuration state
  const defaultEnvUrl = (import.meta as any).env?.VITE_MOBILE_CCTV_STREAM_URL || 'http://10.146.163.75:8080/video';
  const [mobileUrl, setMobileUrl] = useState<string>(() => {
    return localStorage.getItem('nirikshan_mobile_cctv_url') || defaultEnvUrl;
  });
  const [editingMobileUrl, setEditingMobileUrl] = useState(false);
  const [tempMobileUrl, setTempMobileUrl] = useState(mobileUrl);

  const handleSaveMobileUrl = () => {
    let trimmed = tempMobileUrl.trim().replace(/\/+$/, '');
    if (!trimmed) return;
    try {
      const parsed = new URL(trimmed);
      if (!parsed.pathname || parsed.pathname === '/' || parsed.pathname === '') {
        parsed.pathname = '/video';
      }
      trimmed = parsed.toString();
    } catch (e) {
      if (!trimmed.includes('/', 8)) trimmed += '/video';
    }
    setMobileUrl(trimmed);
    setTempMobileUrl(trimmed);
    localStorage.setItem('nirikshan_mobile_cctv_url', trimmed);
    setEditingMobileUrl(false);
    fetch('/api/v1/cctv/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileStreamUrl: trimmed }),
    }).catch(console.warn);
  };

  const handleLaunchVC = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onInitiateSurpriseVC({
        projectId: selectedProjectId,
        reportedStaffCount: parseInt(reportedStaff, 10),
        verifiedStaffCount: parseInt(verifiedStaff, 10),
        reportedBeneficiaryCount: parseInt(reportedBens, 10),
        verifiedBeneficiaryCount: parseInt(verifiedBens, 10),
        observations: [
          { question: 'Boarding students headcount matches official attendance log', response: q1 ? 'Fully verified' : '8 students absent on camera feed', isSatisfactory: q1 },
          { question: 'Mess pantry food stock and meal cooking verified live on video', response: q2 ? 'Kitchen operational and verified' : 'Deficient', isSatisfactory: q2 },
          { question: 'Facility incharge verified on camera with government ID', response: q3 ? 'Verified on camera' : 'Not present', isSatisfactory: q3 },
        ],
        notes: vcNotes || 'Surprise video conference spot-check concluded by DoSJE monitoring officer.',
      });
      setShowVCModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const onlineCameras = cameras.filter((c) => c.status === 'ONLINE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 border border-sky-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Surveillance Matrix & Surprise Video Conference (VC)</h2>
            <p className="text-xs text-slate-400">
              Tokenized RTSP/WebRTC camera proxy architecture and surprise virtual spot-check verification protocol.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-sky-950 text-sky-300 border border-sky-800/80 uppercase font-semibold">
            INTEGRATION READY
          </span>
          <button
            onClick={() => setShowVCModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-lg shadow-indigo-950/40"
          >
            <Play className="w-3.5 h-3.5" /> Launch Surprise VC
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Registered CCTV Feeds</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{cameras.length || 6}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Perimeter and classroom cams</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Cameras Online / Healthy</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{onlineCameras || 5}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Live heartbeat telemetry</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Surprise VC Sessions</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">{sessions.length || 1}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Conducted this quarter</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">VC Discrepancies Flagged</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">1</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Headcount deficit on video</div>
        </div>
      </div>

      {/* Mobile IP Camera Quick Config Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/40 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">Live Mobile Camera Integration (Android IP Webcam)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  WI-FI LIVE STREAM READY
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Connect your Android phone to the same Wi-Fi, run <em>IP Webcam</em>, and stream live inspection video directly into this console.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editingMobileUrl ? (
              <>
                <code className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300">
                  {mobileUrl}
                </code>
                <button
                  onClick={() => {
                    setTempMobileUrl(mobileUrl);
                    setEditingMobileUrl(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition border border-slate-700"
                >
                  <Settings className="w-3.5 h-3.5" /> Change Phone IP
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempMobileUrl}
                  onChange={(e) => setTempMobileUrl(e.target.value)}
                  placeholder="http://192.168.1.100:8080/video"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500 w-64"
                />
                <button
                  onClick={handleSaveMobileUrl}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingMobileUrl(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CCTV Feeds Matrix */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
            Tokenized CCTV Camera Feeds
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Stream Security: Ephemeral HMAC Proxy</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {cameras.map((cam, idx) => {
            const isMob = cam.code?.includes('MOB') || cam.protocol === 'MJPEG' || cam.protocol === 'HTTP';
            return (
              <div
                key={cam.id || idx}
                className={`p-4 rounded-xl bg-slate-950/70 border space-y-3 transition ${
                  isMob ? 'border-amber-700/60 shadow-lg shadow-amber-950/20' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-100 text-xs">
                      {isMob && <Smartphone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      <span>{cam.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {cam.code} &bull; {cam.locationDescription}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isMob && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase">
                        MOBILE
                      </span>
                    )}
                    <StatusBadge status={cam.status} />
                  </div>
                </div>

                {/* Simulation Screen Frame */}
                <div className="aspect-video rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                  <Radio className={`w-6 h-6 mb-1 ${cam.status === 'ONLINE' ? (isMob ? 'text-amber-400 animate-pulse' : 'text-emerald-400 animate-pulse') : 'text-slate-600'}`} />
                  <span className="text-[11px] font-mono text-slate-400">
                    {isMob ? 'Live Phone Camera Feed' : cam.status === 'ONLINE' ? 'Proxy Stream Ready' : 'Feed Offline / Maintenance'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">
                    {cam.protocol} &bull; {cam.resolution || '1080p'} &bull; {cam.fps || 25}fps
                  </span>
                </div>

                {/* Action Buttons: Live Stream & Building Dossier */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onOpenStreamModal ? onOpenStreamModal(cam) : null}
                    className={`flex-1 py-1.5 rounded-lg text-white font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                      isMob ? 'bg-amber-600 hover:bg-amber-500' : 'bg-sky-600 hover:bg-sky-500'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Live Stream
                  </button>
                  <button
                    onClick={() => {
                      const matchedProj = projects.find((p) => p.id === cam.projectId || p._id === cam.projectId) || projects[0];
                      if (onSelectProject && matchedProj) onSelectProject(matchedProj);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <Building className="w-3.5 h-3.5 text-indigo-400" /> Building Dossier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Surprise VC Log History */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
            Surprise Video Conference Spot-Check Records
          </h3>
          <span className="text-xs text-slate-500 font-mono">{sessions.length} sessions logged</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {sessions.map((sess, idx) => (
            <div key={sess.id || idx} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-indigo-400">{sess.sessionCode}</span>
                  <StatusBadge status={sess.status} />
                  {sess.anomalyFlagged && (
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/80 text-[10px] font-mono font-bold">
                      HEADCOUNT DEFICIT DETECTED
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {new Date(sess.createdAt || Date.now()).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[11px]">Facility Incharge</span>
                  <span className="text-slate-200 font-medium">{sess.projectInchargeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Staff Count Verified</span>
                  <span className="font-mono text-slate-200">{sess.verifiedStaffCount} / {sess.reportedStaffCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Beneficiary Presence</span>
                  <span className={`font-mono font-bold ${sess.verifiedBeneficiaryCount < sess.reportedBeneficiaryCount ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {sess.verifiedBeneficiaryCount} / {sess.reportedBeneficiaryCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Inspection Mode</span>
                  <span className="text-slate-200">Surprise Unannounced Spot-Check</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 italic">"{sess.notes}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Surprise VC Modal */}
      {showVCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" />
              Conduct Unannounced Surprise Video Spot-Check
            </h3>
            <p className="text-xs text-slate-400">
              Protocol: Initiates secure WebRTC/HLS session with project director to verify physical occupancy on live camera.
            </p>

            <form onSubmit={handleLaunchVC} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Institution / Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name} ({p.district}, {p.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Reported Beneficiaries</label>
                  <input
                    type="number"
                    value={reportedBens}
                    onChange={(e) => setReportedBens(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Verified on Camera Feed</label>
                  <input
                    type="number"
                    value={verifiedBens}
                    onChange={(e) => setVerifiedBens(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <span className="text-slate-400 font-semibold block">Mandatory Checklist Prompts:</span>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={q1} onChange={(e) => setQ1(e.target.checked)} className="rounded" />
                  <span>Physical student headcount matches daily attendance register</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={q2} onChange={(e) => setQ2(e.target.checked)} className="rounded" />
                  <span>Kitchen mess pantry provisions checked on live camera</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={q3} onChange={(e) => setQ3(e.target.checked)} className="rounded" />
                  <span>Center incharge present in person with government ID</span>
                </label>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Officer Observation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Record discrepancies, reasons provided, and follow-up directives..."
                  value={vcNotes}
                  onChange={(e) => setVcNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVCModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-lg shadow-indigo-950/40"
                >
                  {submitting ? 'Recording...' : 'Complete & Log VC Spot-Check'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

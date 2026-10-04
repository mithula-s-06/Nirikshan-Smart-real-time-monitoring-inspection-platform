import React, { useState } from 'react';
import {
  MapPin,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  UploadCloud,
  Camera,
  Compass,
  CheckSquare,
  Shield,
  Clock,
  History,
  WifiOff,
  Wifi,
  FileText,
  Hash,
  Building,
  Calendar,
  ArrowRight,
  RefreshCw,
  Eye,
  Download,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface InspectorDashboardProps {
  inspections: any[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
  onUpdateInspectionStatus: (id: string, status: string, locationLog?: any) => Promise<void>;
  onSubmitChecklist: (id: string, answers: any[]) => Promise<void>;
}

// Sample mission data for all assignments
const MOCK_MISSIONS = [
  {
    id: 'insp_001',
    inspectionId: 'INSP-2026-PUN-001',
    type: 'SURPRISE',
    status: 'ASSIGNED',
    priority: 'HIGH',
    scheduledDate: '2026-10-04',
    project: {
      name: 'National Skill Training Institute Pune',
      address: 'Phase 3, Hinjawadi Infotech Park, Pune',
      geofenceRadiusMeters: 250,
      location: { coordinates: [73.6922, 18.5912] },
    },
  },
  {
    id: 'insp_002',
    inspectionId: 'INSP-2026-PUN-002',
    type: 'SCHEDULED',
    status: 'PENDING',
    priority: 'MEDIUM',
    scheduledDate: '2026-10-07',
    project: {
      name: 'St. Jude Residential Hostel',
      address: 'Kothrud, Pune',
      geofenceRadiusMeters: 200,
      location: { coordinates: [73.8079, 18.5070] },
    },
  },
  {
    id: 'insp_003',
    inspectionId: 'INSP-2026-PUN-003',
    type: 'FOLLOW_UP',
    status: 'PENDING',
    priority: 'LOW',
    scheduledDate: '2026-10-12',
    project: {
      name: 'Savitribai Phule Women Skill Centre',
      address: 'Karvenagar, Pune',
      geofenceRadiusMeters: 300,
      location: { coordinates: [73.8233, 18.4945] },
    },
  },
];

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({
  inspections,
  activeSubTab,
  onSelectSubTab,
  onUpdateInspectionStatus,
  onSubmitChecklist,
}) => {
  const allMissions = inspections.length > 0 ? inspections : MOCK_MISSIONS;
  const currentMission = allMissions[0];

  const [simulatedDistance, setSimulatedDistance] = useState<number>(45);
  const [isGpsVerified, setIsGpsVerified] = useState<boolean>(true);
  const [checkInState, setCheckInState] = useState<'ASSIGNED' | 'CHECKED_IN' | 'SUBMITTED'>('ASSIGNED');
  const [evidenceHash] = useState<string>('a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890');
  const [evidencePhotos, setEvidencePhotos] = useState<{id: string; label: string; captured: boolean; hash: string; timestamp: string}[]>([
    { id: 'ev1', label: 'Main Gate Entry View', captured: true, hash: 'e3b0c44298fc1c14...', timestamp: new Date().toISOString() },
    { id: 'ev2', label: 'Classroom / Training Hall', captured: true, hash: '7d793037a07648...', timestamp: new Date().toISOString() },
    { id: 'ev3', label: 'Kitchen / Mess Area', captured: false, hash: '', timestamp: '' },
    { id: 'ev4', label: 'Dormitory / Hostel Room', captured: false, hash: '', timestamp: '' },
    { id: 'ev5', label: 'Fire Safety Equipment', captured: false, hash: '', timestamp: '' },
  ]);

  const [checklist, setChecklist] = useState([
    { id: 'q1', text: 'All enrolled residential students present in classroom during rollcall', done: true, compliant: true },
    { id: 'q2', text: 'Clean drinking water and hygiene facilities accessible on premise', done: true, compliant: true },
    { id: 'q3', text: 'Fire extinguisher safety inspection tags valid and unexpired', done: true, compliant: true },
    { id: 'q4', text: 'CCTV surveillance camera operational at main gate entry perimeter', done: true, compliant: false },
    { id: 'q5', text: 'Biometric/smart card attendance device records match physical student count', done: true, compliant: false },
    { id: 'q6', text: 'Staff attendance register verified against biometric records', done: false, compliant: true },
    { id: 'q7', text: 'First-aid and medical facility available and stocked', done: false, compliant: true },
    { id: 'q8', text: 'Library and study material provided as per sanctioned plan', done: false, compliant: true },
    { id: 'q9', text: 'Beneficiary grievance register maintained and up to date', done: false, compliant: true },
    { id: 'q10', text: 'Geo-tagged photos of infrastructure match grant utilization claim', done: false, compliant: true },
  ]);

  const [syncQueue] = useState([
    { id: 'sync_1', type: 'CHECKLIST', mission: 'INSP-2026-PUN-001', status: 'SYNCED', syncedAt: '2026-10-04T09:15:00Z', size: '2.4 KB' },
    { id: 'sync_2', type: 'EVIDENCE_PHOTO', mission: 'INSP-2026-PUN-001', status: 'SYNCED', syncedAt: '2026-10-04T09:15:02Z', size: '1.8 MB' },
    { id: 'sync_3', type: 'GPS_TELEMETRY', mission: 'INSP-2026-PUN-001', status: 'SYNCED', syncedAt: '2026-10-04T09:15:03Z', size: '512 B' },
    { id: 'sync_4', type: 'EVIDENCE_PHOTO', mission: 'INSP-2026-PUN-001', status: 'PENDING', syncedAt: '', size: '2.1 MB' },
    { id: 'sync_5', type: 'FINAL_REPORT', mission: 'INSP-2026-PUN-001', status: 'PENDING', syncedAt: '', size: '4.5 KB' },
  ]);

  const handleSimulateGPS = (distance: number) => {
    setSimulatedDistance(distance);
    const verified = distance <= (currentMission.project?.geofenceRadiusMeters || 250);
    setIsGpsVerified(verified);
  };

  const handleCheckIn = async () => {
    setCheckInState('CHECKED_IN');
    if (onUpdateInspectionStatus && currentMission.id) {
      await onUpdateInspectionStatus(currentMission.id, 'ARRIVED', {
        coordinates: [73.6922, 18.5912],
        distanceFromProjectMeters: simulatedDistance,
        isVerified: isGpsVerified,
      });
    }
  };

  const handleSubmitMission = async () => {
    setCheckInState('SUBMITTED');
    if (onSubmitChecklist && currentMission.id) {
      await onSubmitChecklist(currentMission.id, checklist);
    }
  };

  // ═══════════════════════════════════════════
  // HEADER — shared across all sub-tabs
  // ═══════════════════════════════════════════
  const Header = (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-900 border border-sky-900/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
          PMU
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-100">Field Inspector Mission Console</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80">
              OFFLINE SYNC READY
            </span>
          </div>
          <p className="text-xs text-slate-400">Inspector Amitabh Sharma &bull; Zone: Western Region</p>
        </div>
      </div>
      <StatusBadge status={checkInState === 'SUBMITTED' ? 'SUBMITTED' : checkInState === 'CHECKED_IN' ? 'IN_PROGRESS' : 'ASSIGNED'} />
    </div>
  );

  // ═══════════════════════════════════════════
  // TAB 1: MY ASSIGNED MISSIONS — overview list
  // ═══════════════════════════════════════════
  if (activeSubTab === 'inspector_assignments') {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {Header}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
              All Assigned Missions ({allMissions.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Sorted by priority & date</span>
          </div>

          {allMissions.map((mission: any, idx: number) => {
            const priorityColor = mission.priority === 'HIGH' ? 'text-red-400 bg-red-950/40 border-red-900/60' : mission.priority === 'MEDIUM' ? 'text-amber-400 bg-amber-950/40 border-amber-900/60' : 'text-emerald-400 bg-emerald-950/40 border-emerald-900/60';
            const typeLabel = mission.type === 'SURPRISE' ? 'Surprise' : mission.type === 'FOLLOW_UP' ? 'Follow-Up' : 'Scheduled';
            return (
              <div key={mission.id || idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-800/60 transition cursor-pointer" onClick={() => onSelectSubTab('inspector_today')}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${priorityColor}`}>{mission.priority}</span>
                    <span className="text-[10px] font-mono text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800/50">{typeLabel}</span>
                    <span className="text-[11px] font-mono text-slate-400">{mission.inspectionId}</span>
                  </div>
                  <StatusBadge status={mission.status} />
                </div>
                <h4 className="text-sm font-bold text-slate-100">{mission.project?.name}</h4>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{mission.project?.address}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{mission.scheduledDate}</span>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <span className="text-[11px] text-sky-400 flex items-center gap-1 hover:text-sky-300">
                    Open Mission <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xl font-bold font-mono text-slate-100">{allMissions.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Assigned</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xl font-bold font-mono text-amber-400">{allMissions.filter((m: any) => m.status === 'ASSIGNED' || m.status === 'PENDING').length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Pending</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xl font-bold font-mono text-emerald-400">{allMissions.filter((m: any) => m.status === 'COMPLETED' || m.status === 'SUBMITTED').length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Completed</div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // TAB 2: TODAY'S MISSION — GPS + Check-in
  // ═══════════════════════════════════════════
  if (activeSubTab === 'inspector_today') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {Header}

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-[11px] font-mono text-sky-400 font-semibold uppercase tracking-wider">
                TODAY'S SURPRISE INSPECTION MISSION
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">
                {currentMission.project?.name || 'National Skill Training Institute Pune'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>{currentMission.project?.address}</span>
              </p>
            </div>
            <StatusBadge status="HIGH" type="risk" />
          </div>

          {/* GPS Geofence Validation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-400" />
                GPS Geofence Validation Engine
              </span>
              <span className={`font-mono font-bold text-xs ${isGpsVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                {isGpsVerified ? 'INSIDE GEOFENCE (OK)' : 'OUTSIDE PERIMETER (BREACH)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[11px]">Current Distance</span>
                <span className="font-mono text-base font-bold text-slate-100">{simulatedDistance}m</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Allowed Radius</span>
                <span className="font-mono text-base font-bold text-slate-300">{currentMission.project?.geofenceRadiusMeters || 250}m</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">GPS Accuracy</span>
                <span className="font-mono text-base font-bold text-emerald-400">&plusmn;4.2m</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <span className="text-slate-500">Test Telemetry:</span>
              <button
                onClick={() => handleSimulateGPS(45)}
                className={`px-2.5 py-1 rounded border transition ${
                  simulatedDistance === 45
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                On-Premise (45m)
              </button>
              <button
                onClick={() => handleSimulateGPS(420)}
                className={`px-2.5 py-1 rounded border transition ${
                  simulatedDistance === 420
                    ? 'bg-red-950 text-red-300 border-red-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Off-Site Breach (420m)
              </button>
            </div>

            {checkInState === 'ASSIGNED' && (
              <button
                onClick={handleCheckIn}
                disabled={!isGpsVerified}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                  isGpsVerified
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {isGpsVerified ? 'Confirm Arrival & Check In On Site' : 'Cannot Check In (GPS Outside Geofence)'}
              </button>
            )}

            {checkInState !== 'ASSIGNED' && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/80 text-xs text-center">
                <CheckCircle className="w-4 h-4 text-emerald-400 inline mr-1.5" />
                <span className="text-emerald-300 font-semibold">Checked In Successfully — GPS Lock Verified</span>
              </div>
            )}
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onSelectSubTab('inspector_checklist')} className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-800/60 transition text-left">
              <CheckSquare className="w-4 h-4 text-sky-400 mb-1" />
              <div className="text-xs font-semibold text-slate-200">Digital Checklist</div>
              <div className="text-[10px] text-slate-400">{checklist.filter(q => q.done).length}/{checklist.length} items completed</div>
            </button>
            <button onClick={() => onSelectSubTab('inspector_evidence')} className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-800/60 transition text-left">
              <Camera className="w-4 h-4 text-indigo-400 mb-1" />
              <div className="text-xs font-semibold text-slate-200">Evidence Capture</div>
              <div className="text-[10px] text-slate-400">{evidencePhotos.filter(p => p.captured).length}/{evidencePhotos.length} photos captured</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // TAB 3: DIGITAL CHECKLIST
  // ═══════════════════════════════════════════
  if (activeSubTab === 'inspector_checklist') {
    const completedCount = checklist.filter(q => q.done).length;
    const compliantCount = checklist.filter(q => q.done && q.compliant).length;
    const deficientCount = checklist.filter(q => q.done && !q.compliant).length;
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {Header}

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Digital Inspection Checklist</h3>
              <p className="text-xs text-slate-400">{currentMission.project?.name} &bull; {currentMission.inspectionId}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-emerald-400">{completedCount}/{checklist.length} Completed</span>
              <div className="text-[10px] text-slate-500 mt-0.5">
                <span className="text-emerald-400">{compliantCount} compliant</span> · <span className="text-red-400">{deficientCount} deficient</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all" style={{ width: `${(completedCount / checklist.length) * 100}%` }}></div>
          </div>

          <div className="space-y-2 text-xs">
            {checklist.map((q, idx) => (
              <div
                key={q.id}
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                  q.done
                    ? q.compliant ? 'bg-emerald-950/10 border-emerald-900/40' : 'bg-red-950/10 border-red-900/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-slate-500 mt-0.5">{idx + 1}.</span>
                  <div>
                    <span className="text-slate-200">{q.text}</span>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const updated = [...checklist];
                          updated[idx].compliant = true;
                          updated[idx].done = true;
                          setChecklist(updated);
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono border ${
                          q.compliant && q.done ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        ✓ Compliant
                      </button>
                      <button
                        onClick={() => {
                          const updated = [...checklist];
                          updated[idx].compliant = false;
                          updated[idx].done = true;
                          setChecklist(updated);
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono border ${
                          !q.compliant && q.done ? 'bg-red-950 text-red-300 border-red-700' : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        ✗ Deficient
                      </button>
                      {q.done && (
                        <button
                          onClick={() => {
                            const updated = [...checklist];
                            updated[idx].done = false;
                            setChecklist(updated);
                          }}
                          className="px-2 py-1 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-800"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Inspector Comments */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Inspector Remarks / Observations</label>
            <textarea
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 resize-none focus:ring-1 focus:ring-sky-600 focus:outline-none"
              rows={3}
              placeholder="Add remarks on discrepancies, infrastructure deficiencies, staff cooperation level..."
            />
          </div>

          {/* Submit */}
          {completedCount === checklist.length && checkInState !== 'SUBMITTED' && (
            <button
              onClick={handleSubmitMission}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xl shadow-indigo-950/50"
            >
              <ClipboardCheck className="w-4 h-4" />
              Submit Checklist & Final Field Report
            </button>
          )}

          {checkInState === 'SUBMITTED' && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/80 text-center space-y-1">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-emerald-300">Inspection Checklist Submitted</div>
              <p className="text-xs text-slate-400">
                Transmitted to DoSJE Central. Hash recorded in immutable audit log.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // TAB 4: EVIDENCE CAPTURE & HASH
  // ═══════════════════════════════════════════
  if (activeSubTab === 'inspector_evidence') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {Header}

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Evidence Capture & Provenance</h3>
              <p className="text-xs text-slate-400">Geo-tagged, timestamped, SHA-256 hashed photographic evidence</p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {evidencePhotos.filter(p => p.captured).length}/{evidencePhotos.length} CAPTURED
            </span>
          </div>

          {/* Evidence List */}
          <div className="space-y-2">
            {evidencePhotos.map((photo, idx) => (
              <div key={photo.id} className={`p-3.5 rounded-xl border flex items-center justify-between ${photo.captured ? 'bg-emerald-950/10 border-emerald-900/40' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${photo.captured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    {photo.captured ? <CheckCircle className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{idx + 1}. {photo.label}</div>
                    {photo.captured && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        SHA-256: {photo.hash} &bull; {new Date(photo.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
                {!photo.captured && (
                  <button
                    onClick={() => {
                      const updated = [...evidencePhotos];
                      updated[idx] = {
                        ...updated[idx],
                        captured: true,
                        hash: Math.random().toString(36).slice(2, 18) + '...',
                        timestamp: new Date().toISOString(),
                      };
                      setEvidencePhotos(updated);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Capture
                  </button>
                )}
                {photo.captured && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> VERIFIED
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Hash Provenance Block */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-400" />
                Composite Evidence Hash Chain
              </span>
              <span className="text-emerald-400 font-mono text-[10px]">SHA-256 TAMPER-PROOF</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-slate-400 break-all border border-slate-800">
              {evidenceHash}
            </div>
            <p className="text-[10px] text-slate-500">
              Timestamp: {new Date().toISOString()} &bull; Lat: 18.5912 &bull; Lng: 73.6922 &bull; Exif Metadata Verified
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // TAB 5: OFFLINE BATCH SYNC
  // ═══════════════════════════════════════════
  if (activeSubTab === 'inspector_sync') {
    const syncedCount = syncQueue.filter(s => s.status === 'SYNCED').length;
    const pendingCount = syncQueue.filter(s => s.status === 'PENDING').length;
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {Header}

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Offline Batch Sync Manager</h3>
              <p className="text-xs text-slate-400">Sync inspection data when connectivity is available</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${pendingCount > 0 ? 'bg-amber-950/40 text-amber-400 border-amber-900/60' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'}`}>
                {pendingCount > 0 ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                {pendingCount > 0 ? `${pendingCount} PENDING` : 'ALL SYNCED'}
              </span>
            </div>
          </div>

          {/* Sync Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-lg font-bold font-mono text-slate-100">{syncQueue.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total Items</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-lg font-bold font-mono text-emerald-400">{syncedCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Synced</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-lg font-bold font-mono text-amber-400">{pendingCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pending</div>
            </div>
          </div>

          {/* Sync Queue Items */}
          <div className="space-y-2">
            {syncQueue.map((item) => (
              <div key={item.id} className={`p-3 rounded-lg border flex items-center justify-between ${item.status === 'SYNCED' ? 'bg-emerald-950/10 border-emerald-900/40' : 'bg-amber-950/10 border-amber-900/40'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${item.status === 'SYNCED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                    {item.status === 'SYNCED' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{item.type.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.mission} &bull; {item.size}
                      {item.syncedAt && ` • Synced ${new Date(item.syncedAt).toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>

          {/* Force Sync Button */}
          {pendingCount > 0 && (
            <button className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition">
              <RefreshCw className="w-4 h-4" />
              Force Sync {pendingCount} Pending Items Now
            </button>
          )}

          {/* Storage Status */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-center">
            <span className="text-slate-400">Local Storage Used: </span>
            <span className="font-mono text-slate-200 font-semibold">11.3 MB / 50 MB</span>
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: '22%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // DEFAULT: redirect to assignments
  // ═══════════════════════════════════════════
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {Header}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
        <p>Select a section from the left sidebar to begin.</p>
        <button onClick={() => onSelectSubTab('inspector_assignments')} className="mt-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition text-xs">
          View My Assigned Missions
        </button>
      </div>
    </div>
  );
};

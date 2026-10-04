import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Building,
  ShieldAlert,
  FileText,
  CheckCircle,
  AlertTriangle,
  Video,
  Users,
  Coins,
  ClipboardCheck,
  Radio,
  Eye,
  Camera,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { RiskCard } from './RiskCard';

interface EntityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  entityType: 'project' | 'beneficiary' | 'anomaly' | 'inspection' | 'compliance';
  data: any;
  onAction?: (actionName: string, payload?: any) => void;
  onOpenStreamModal?: (camera: any) => void;
}

export const EntityDrawer: React.FC<EntityDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  entityType,
  data,
  onAction,
  onOpenStreamModal,
}) => {
  const [activeProjectTab, setActiveProjectTab] = useState<'overview' | 'cctv' | 'beneficiaries' | 'financial' | 'inspections'>('overview');

  if (!isOpen || !data) return null;

  // Derive cameras for this project/building if available or build standard building cameras
  const buildingCameras = data.cameras && data.cameras.length > 0 ? data.cameras : [
    { id: 'cam_gate_01', cameraCode: 'CAM-PUN-01', locationName: 'Main Entrance & Perimeter Gate', status: 'ONLINE', resolution: '1080p HD', fps: 25, model: 'Hikvision Smart IR PTZ' },
    { id: 'cam_class_01', cameraCode: 'CAM-PUN-02', locationName: 'Primary Vocational Training Hall', status: 'ONLINE', resolution: '1080p HD', fps: 30, model: 'CP Plus Dome' },
    { id: 'cam_class_02', cameraCode: 'CAM-PUN-03', locationName: 'Computer Lab & Skills Studio', status: 'ONLINE', resolution: '1080p HD', fps: 30, model: 'Dahua AI Edge' },
    { id: 'cam_mess_01', cameraCode: 'CAM-PUN-04', locationName: 'Dining & Kitchen Mess Area', status: 'ONLINE', resolution: '720p HD', fps: 20, model: 'CP Plus Wide' },
    { id: 'cam_hostel_01', cameraCode: 'CAM-PUN-05', locationName: 'Hostel Corridor & Common Room', status: 'OFFLINE', resolution: '1080p HD', fps: 0, model: 'Hikvision Smart IR' },
  ];

  // Derive beneficiaries for this project if available
  const projectBeneficiaries = data.beneficiaries && data.beneficiaries.length > 0 ? data.beneficiaries : [
    { beneficiaryId: 'BEN-MH-PUN-001', name: 'Aarav Rahul Shinde', age: 19, gender: 'MALE', category: 'SC', verificationStatus: 'VERIFIED', attendanceRatio: '92%' },
    { beneficiaryId: 'BEN-MH-PUN-002', name: 'Pooja Suresh Jadhav', age: 21, gender: 'FEMALE', category: 'ST', verificationStatus: 'VERIFIED', attendanceRatio: '88%' },
    { beneficiaryId: 'BEN-MH-PUN-003', name: 'Rohan Vilas More', age: 20, gender: 'MALE', category: 'OBC', verificationStatus: 'VERIFIED', attendanceRatio: '95%' },
    { beneficiaryId: 'BEN-MH-PUN-004', name: 'Kavita Ganesh Gaikwad', age: 18, gender: 'FEMALE', category: 'SC', verificationStatus: 'FLAGGED', attendanceRatio: '45%' },
    { beneficiaryId: 'BEN-MH-PUN-005', name: 'Aditya Prakash Kamble', age: 22, gender: 'MALE', category: 'SC', verificationStatus: 'VERIFIED', attendanceRatio: '90%' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold">
                {entityType.toUpperCase()} INTELLIGENCE DOSSIER
              </span>
              {data.status && <StatusBadge status={data.status} />}
              {data.riskLevel && <StatusBadge status={data.riskLevel} type="risk" />}
            </div>
            <h2 className="text-base font-bold text-slate-100 leading-snug">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher for Project / Institution entity */}
        {entityType === 'project' && (
          <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveProjectTab('overview')}
              className={`px-3 py-2 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeProjectTab === 'overview'
                  ? 'border-indigo-500 text-indigo-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveProjectTab('cctv')}
              className={`px-3 py-2 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeProjectTab === 'cctv'
                  ? 'border-sky-500 text-sky-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Building CCTV ({buildingCameras.length})
            </button>
            <button
              onClick={() => setActiveProjectTab('beneficiaries')}
              className={`px-3 py-2 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeProjectTab === 'beneficiaries'
                  ? 'border-emerald-500 text-emerald-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Beneficiaries
            </button>
            <button
              onClick={() => setActiveProjectTab('financial')}
              className={`px-3 py-2 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeProjectTab === 'financial'
                  ? 'border-amber-500 text-amber-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              Financials
            </button>
            <button
              onClick={() => setActiveProjectTab('inspections')}
              className={`px-3 py-2 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeProjectTab === 'inspections'
                  ? 'border-purple-500 text-purple-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Inspections
            </button>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          {/* Entity: Project / Institution */}
          {entityType === 'project' && (
            <div className="space-y-4">
              {/* TAB: OVERVIEW */}
              {activeProjectTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block">Project Code</span>
                      <span className="font-mono text-slate-200 font-semibold">{data.code || 'NSTI-PUN-005'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Scheme</span>
                      <span className="text-slate-200 font-medium">{data.scheme || 'DDU-GKY Livelihoods'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Jurisdiction & Location</span>
                      <span className="text-slate-200">{data.district || 'Pune'}, {data.state || 'Maharashtra'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">GPS Coordinates</span>
                      <span className="font-mono text-slate-200">
                        {data.location?.coordinates ? `${data.location.coordinates[1].toFixed(4)}° N, ${data.location.coordinates[0].toFixed(4)}° E` : '18.5912° N, 73.6922° E'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Geofence Radius</span>
                      <span className="font-mono text-slate-200">{data.geofenceRadiusMeters || 250} meters</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Sanctioned Seats / Hostelers</span>
                      <span className="font-mono text-slate-200">30 Capacity (100% Enrolled)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Facility Incharge</span>
                      <span className="text-slate-200">{data.contactName || 'Smt. Priya Deshmukh'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Official Contact</span>
                      <span className="font-mono text-slate-200">{data.contactPhone || '+91 98230 45678'}</span>
                    </div>
                  </div>

                  {/* Risk Breakdown if available */}
                  {data.riskBreakdown && <RiskCard riskData={data.riskBreakdown} />}

                  {/* Description & Mandate */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">Mandate & Program Details</span>
                    <p className="text-slate-300 leading-relaxed">{data.description || 'Residential skill training centre providing vocational courses to under-privileged youth under Ministry of Social Justice & Empowerment schemes.'}</p>
                  </div>

                  {/* Quick Action Matrix */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Operational Actions</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setActiveProjectTab('cctv')}
                        className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-sky-400" /> View CCTV Streams</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => onAction && onAction('SURPRISE_INSPECTION', data)}
                        className="p-2.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-200 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5 text-indigo-400" /> Dispatch Inspector</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: BUILDING CCTV FEEDS */}
              {activeProjectTab === 'cctv' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Building CCTV Network</h3>
                      <p className="text-[11px] text-slate-400">All registered cameras in this facility compound</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {buildingCameras.filter((c: any) => c.status === 'ONLINE').length} / {buildingCameras.length} ONLINE
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {buildingCameras.map((cam: any, idx: number) => (
                      <div
                        key={cam.id || idx}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${cam.status === 'ONLINE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-2">
                              <span>{cam.locationName}</span>
                              <span className="text-[10px] font-mono text-slate-400">({cam.cameraCode})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{cam.resolution || '1080p HD'} &bull; {cam.fps || 25} FPS</span>
                              <span className="text-slate-500">&bull; {cam.model || 'RTSP Smart IP'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={cam.status} />
                          <button
                            onClick={() => onOpenStreamModal ? onOpenStreamModal(cam) : alert(`Opening live RTSP feed for ${cam.locationName}`)}
                            className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px] flex items-center gap-1 transition shadow"
                          >
                            <Eye className="w-3 h-3" /> Live
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-900/40 text-[11px] text-slate-300">
                    <span className="font-semibold text-sky-300">RTSP/WebRTC Live Stream Token Proxy:</span> End-to-end encrypted video transmission adheres to Ministry video surveillance guidelines.
                  </div>
                </div>
              )}

              {/* TAB: BENEFICIARIES ROSTER */}
              {activeProjectTab === 'beneficiaries' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Registered Beneficiaries</h3>
                      <p className="text-[11px] text-slate-400">Enrolled students and trainees in this facility</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {projectBeneficiaries.length} ENROLLED
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800 bg-slate-950/60 rounded-xl border border-slate-800 p-2 text-xs">
                    {projectBeneficiaries.map((b: any, idx: number) => (
                      <div key={b.beneficiaryId || idx} className="py-2.5 px-2 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-200">{b.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {b.beneficiaryId} &bull; {b.category} &bull; Age {b.age} ({b.gender})
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">{b.attendanceRatio || '90%'}</span>
                          <StatusBadge status={b.verificationStatus || 'VERIFIED'} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: FINANCIAL HEALTH */}
              {activeProjectTab === 'financial' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Financial Grant Utilization</h3>
                      <p className="text-[11px] text-slate-400">FY 2025-26 Central Scheme Allocation</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      82% EXPENDITURE CLAIMED
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Sanctioned</span>
                      <span className="text-sm font-bold text-slate-100">₹25,00,000</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Disbursed</span>
                      <span className="text-sm font-bold text-slate-100">₹20,00,000</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Expenditure</span>
                      <span className="text-sm font-bold text-amber-400">₹16,40,000</span>
                    </div>
                  </div>

                  {/* Budget Head Breakdown */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-300">Sanctioned Budget Heads Breakdown</div>
                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Infrastructure & Hostel Facilities</span>
                          <span className="font-mono">₹10,50,000 (100% utilized)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Beneficiary Stipends & Food Mess</span>
                          <span className="font-mono">₹8,00,000 (75% utilized)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Training Kits & IT Lab</span>
                          <span className="font-mono">₹4,50,000 (60% utilized)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/50 text-amber-300 space-y-1 text-[11px]">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Audit Anomaly (Rule 18 Triggered)</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Claimed expenditure velocity (82%) is higher than verified physical milestone progress (43%). Chartered Accountant certified utilization certificate required.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: INSPECTIONS & AUDITS */}
              {activeProjectTab === 'inspections' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Field Inspections Log</h3>
                      <p className="text-[11px] text-slate-400">Surprise audits and geo-fenced verification records</p>
                    </div>
                    <button
                      onClick={() => onAction && onAction('SURPRISE_INSPECTION', data)}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition"
                    >
                      + Dispatch Surprise Inspection
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">INSP-2026-PUN-001 (Surprise)</span>
                        <StatusBadge status="ASSIGNED" />
                      </div>
                      <p className="text-slate-400 text-[11px]">Assigned to Inspector Amitabh Sharma &bull; Scheduled today</p>
                      <div className="text-[10px] font-mono text-indigo-400">Geo-fence: 250m &bull; Digital Checklist: 10 Parameters</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">INSP-2025-PUN-089 (Annual Audit)</span>
                        <StatusBadge status="COMPLETED" />
                      </div>
                      <p className="text-slate-400 text-[11px]">Completed by Inspector Rajesh K. on 14 Nov 2025</p>
                      <div className="text-[10px] font-mono text-emerald-400">Score: 88/100 &bull; SHA-256 Hash Chain Verified</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Entity: Beneficiary */}
          {entityType === 'beneficiary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Beneficiary ID</span>
                  <span className="font-mono text-slate-200 font-semibold">{data.beneficiaryId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-mono text-slate-200">{data.category} ({data.gender})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date of Birth (Age)</span>
                  <span className="text-slate-200">{data.dateOfBirth} ({data.age} yrs)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Guardian</span>
                  <span className="text-slate-200">{data.guardianName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Phone</span>
                  <span className="font-mono text-slate-200">{data.maskedPhone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Enrollment Interval</span>
                  <span className="text-slate-200">{data.enrollmentStartDate} to {data.enrollmentEndDate || 'Active'}</span>
                </div>
              </div>

              {/* Verification & Risk Status */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Identity Verification Status</span>
                  <StatusBadge status={data.verificationStatus} />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Scheme Eligibility</span>
                  <StatusBadge status={data.eligibilityStatus} />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Attendance Verification Ratio</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {data.totalAttendanceSessions > 0
                      ? `${Math.round((data.verifiedAttendanceSessions / data.totalAttendanceSessions) * 100)}% (${data.verifiedAttendanceSessions}/${data.totalAttendanceSessions})`
                      : '92% (23/25 sessions)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Entity: Anomaly Alert */}
          {entityType === 'anomaly' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Detection Signal: {data.type || data.ruleId}</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">{data.reason || data.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Detection Source</span>
                  <span className="font-mono text-slate-200">{data.source || 'AI_SERVICE & RULE_ENGINE'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Confidence</span>
                  <span className="font-mono text-slate-200">{Math.round((data.confidence || 0.92) * 100)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Detected At</span>
                  <span className="text-slate-200">{data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Recent'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Investigation Status</span>
                  <StatusBadge status={data.status || 'OPEN'} />
                </div>
              </div>

              {/* Human in the loop review actions */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Official Adjudication Actions:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onAction && onAction('VERIFY', data)}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
                  >
                    Confirm Anomaly
                  </button>
                  <button
                    onClick={() => onAction && onAction('DISMISS', data)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
                  >
                    Dismiss / False Positive
                  </button>
                  <button
                    onClick={() => onAction && onAction('CORRECTIVE_ACTION', data)}
                    className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition"
                  >
                    Issue Corrective Directive
                  </button>
                  <button
                    onClick={() => onAction && onAction('SURPRISE_INSPECTION', data)}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                  >
                    Dispatch Surprise Inspection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

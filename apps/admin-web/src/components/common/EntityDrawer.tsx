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
  CheckSquare,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { RiskCard } from './RiskCard';

interface EntityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  entityType: 'project' | 'beneficiary' | 'anomaly' | 'inspection' | 'compliance' | 'organization';
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
              Beneficiaries ({projectBeneficiaries.length})
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
                      <span className="font-mono text-slate-200 font-semibold">{data.code || 'PRJ-PUN-001'}</span>
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

                  {/* Linked NGO / Organization Card */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-indigo-300">Implementing NGO / Partner Organization</span>
                      </div>
                      {data.organizationId && (
                        <button
                          onClick={() => onAction && onAction('SWITCH_ENTITY', { type: 'organization', entity: data.organizationId })}
                          className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-mono transition"
                        >
                          View NGO &rarr;
                        </button>
                      )}
                    </div>
                    <div className="text-slate-200 font-semibold">
                      {data.organizationId?.name || data.organizationName || 'Gramin Vikas Sahayog Foundation'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Code: {data.organizationId?.code || 'GVSF-NGO'} &bull; Type: {data.organizationId?.type || 'NGO'}
                    </div>
                  </div>

                  {/* Risk Breakdown if available */}
                  {data.riskBreakdown && <RiskCard riskData={data.riskBreakdown} />}

                  {/* Description & Mandate */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">Mandate & Program Details</span>
                    <p className="text-slate-300 leading-relaxed">{data.description || 'Residential skill training centre providing vocational courses to under-privileged youth under Ministry schemes.'}</p>
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
                        onClick={() => setActiveProjectTab('beneficiaries')}
                        className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-400" /> View Beneficiaries</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => onAction && onAction('SURPRISE_INSPECTION', data)}
                        className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5 text-purple-400" /> Trigger Inspection</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => onAction && onAction('CORRECTIVE_ACTION', data)}
                        className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-amber-400" /> Issue Directive</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CCTV STREAMS */}
              {activeProjectTab === 'cctv' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Building CCTV Camera Network</h3>
                      <p className="text-[11px] text-slate-400">Live surveillance feeds & tamper detection</p>
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
                              <span>{cam.locationName || cam.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">({cam.cameraCode || cam.code})</span>
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
                          <button
                            onClick={() => onAction && onAction('SWITCH_ENTITY', { type: 'beneficiary', entity: b })}
                            className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-mono transition"
                          >
                            Dossier &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: FINANCIAL HEALTH */}
              {activeProjectTab === 'financial' && (() => {
                const fin = data.financialRecord;
                const sanctioned = fin?.totalSanctionedGrant || 2500000;
                const disbursed = fin?.totalDisbursedFunds || 2000000;
                const expenditure = fin?.totalExpenditure || 1640000;
                const burn = fin?.financialBurnPercent || Math.round((expenditure / (disbursed || 1)) * 100);
                const phys = fin?.verifiedPhysicalProgressPercent || 50;
                const deficit = Math.round(burn - phys);
                const isSevere = deficit > 20;
                const flaggedInvoices = fin?.invoices?.filter((inv: any) => inv.isFlagged) || [];

                return (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Financial Grant Utilization</h3>
                        <p className="text-[11px] text-slate-400">
                          FY {fin?.financialYear || '2025-26'} &bull; Central Ministry Scheme Allocation
                        </p>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isSevere
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {burn}% EXPENDITURE BURN
                      </span>
                    </div>

                    {/* Financial Key Metrics */}
                    <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Sanctioned</span>
                        <span className="text-sm font-bold text-slate-100">₹{sanctioned.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Disbursed</span>
                        <span className="text-sm font-bold text-emerald-400">₹{disbursed.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Expenditure</span>
                        <span className="text-sm font-bold text-amber-400">₹{expenditure.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Progress Deficit Bar */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">Physical Progress vs Financial Burn</span>
                        <span className="font-mono text-[11px]">
                          {isSevere ? (
                            <span className="text-red-400 font-bold">+{deficit}% Deficit (High Risk)</span>
                          ) : (
                            <span className="text-emerald-400">Normal Balance</span>
                          )}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Verified Physical Milestones: {phys}%</span>
                          <span>Fund Consumption: {burn}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, phys)}%` }} />
                          {deficit > 0 && (
                            <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100 - phys, deficit)}%` }} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Budget Heads */}
                    {fin?.budgetHeads && fin.budgetHeads.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wider">
                          Itemized Budget Heads
                        </span>
                        {fin.budgetHeads.map((head: any, idx: number) => {
                          const util = head.utilizedAmount || 0;
                          const sanc = head.sanctionedAmount || 1;
                          const pct = Math.round((util / sanc) * 100);
                          return (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-300">{head.name}</span>
                                <span className="font-mono text-slate-400">
                                  ₹{util.toLocaleString('en-IN')} / ₹{sanc.toLocaleString('en-IN')} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${pct > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Flagged Split Invoices Warning */}
                    {flaggedInvoices.length > 0 && (
                      <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/60 space-y-1.5 text-xs text-red-200">
                        <div className="flex items-center gap-1.5 font-bold text-red-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{flaggedInvoices.length} Flagged Invoices (Rule 20 Ceiling Split)</span>
                        </div>
                        {flaggedInvoices.map((inv: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-slate-300 font-mono">
                            &bull; {inv.invoiceNumber}: ₹{(inv.amount || 0).toLocaleString('en-IN')} ({inv.vendorName})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

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
                  <span className="font-mono text-slate-200">{data.maskedPhone || '+91-98765*****'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location</span>
                  <span className="text-slate-200">{data.district}, {data.state}</span>
                </div>
              </div>

              {/* Linked Project Facility & Implementing NGO Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Linked Project Card */}
                <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-900/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Linked Project Facility
                    </span>
                    {data.linkedProject && (
                      <button
                        onClick={() => onAction && onAction('SWITCH_ENTITY', { type: 'project', entity: data.linkedProject })}
                        className="px-2 py-0.5 rounded bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 text-[10px] font-mono transition"
                      >
                        View &rarr;
                      </button>
                    )}
                  </div>
                  <div className="font-semibold text-slate-200">
                    {data.linkedProject?.name || data.projectName || 'PMKVY Multi-Skill Training Center Aundh'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Code: {data.linkedProject?.code || 'PRJ-PUN-001'} &bull; Radius: {data.linkedProject?.geofenceRadiusMeters || 200}m
                  </div>
                </div>

                {/* Linked Implementing NGO Card */}
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> Implementing NGO / Partner
                    </span>
                    {data.linkedOrg && (
                      <button
                        onClick={() => onAction && onAction('SWITCH_ENTITY', { type: 'organization', entity: data.linkedOrg })}
                        className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-mono transition"
                      >
                        View &rarr;
                      </button>
                    )}
                  </div>
                  <div className="font-semibold text-slate-200">
                    {data.linkedOrg?.name || data.organizationName || 'Gramin Vikas Sahayog Foundation'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    [{data.linkedOrg?.type || 'NGO'}] {data.linkedOrg?.code || 'GVSF-NGO'}
                  </div>
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

          {/* Entity: Organization / NGO */}
          {entityType === 'organization' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Entity Classification</span>
                  <span className="font-mono text-indigo-300 font-semibold">{data.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Registration Code</span>
                  <span className="font-mono text-slate-200">{data.code}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">NITI Aayog Darpan ID</span>
                  <span className="font-mono text-slate-200">{data.darpanId || `IND-${data.state?.slice(0, 2).toUpperCase()}-2024-${data.code}`}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jurisdiction</span>
                  <span className="text-slate-200">{data.district}, {data.state}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Phone</span>
                  <span className="font-mono text-slate-200">{data.contactPhone || '+91-9876543210'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Official Email</span>
                  <span className="text-slate-200">{data.contactEmail}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Headquarters Address</span>
                  <span className="text-slate-200">{data.address}</span>
                </div>
              </div>

              {/* Linked Projects under this NGO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-sky-400" /> Linked Monitored Projects
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                    {data.linkedProjects?.length || 2} ACTIVE SITES
                  </span>
                </div>

                <div className="space-y-2">
                  {(data.linkedProjects || []).slice(0, 4).map((p: any) => (
                    <div
                      key={p._id || p.id}
                      onClick={() => onAction && onAction('SWITCH_ENTITY', { type: 'project', entity: p })}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.code} &bull; {p.district}, {p.state}</div>
                      </div>
                      <StatusBadge status={p.riskLevel} type="risk" />
                    </div>
                  ))}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

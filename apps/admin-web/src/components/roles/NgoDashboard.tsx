import React, { useState } from 'react';
import {
  Building,
  Users,
  Camera,
  UserCheck,
  Coins,
  ClipboardCheck,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  UploadCloud,
  FileText,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Check
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import CaptureWorkflow from '../attendance/CaptureWorkflow';
import StaffCheckin from '../attendance/StaffCheckin';

interface NgoDashboardProps {
  organization: any;
  projects: any[];
  beneficiaries: any[];
  actions: any[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
  onRefreshData?: () => void;
}

export const NgoDashboard: React.FC<NgoDashboardProps> = ({
  organization,
  projects,
  beneficiaries,
  actions,
  activeSubTab,
  onSelectSubTab,
  onRefreshData,
}) => {
  const orgName = organization?.name || 'National Skill Training Institute Pune';
  const myProjects = projects.filter((p) => p.organizationId?.id === organization?.id || true);

  const [uploadedCert, setUploadedCert] = useState<boolean>(false);
  const [activeInvoiceFilter, setActiveInvoiceFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');

  const invoices = [
    { id: 'INV-2026-081', vendor: 'Sahyadri Agro Provisions (Mess Meals)', head: 'Food & Nutrition', amount: '₹2,40,000', date: '28 Sep 2026', status: 'VERIFIED', geoPhoto: 'Verified' },
    { id: 'INV-2026-082', vendor: 'Apex IT Systems (15 Refurbished Desktops)', head: 'IT Training Kits', amount: '₹3,75,000', date: '15 Sep 2026', status: 'VERIFIED', geoPhoto: 'Verified' },
    { id: 'INV-2026-083', vendor: 'Pune Civil Contractors (Hostel Repairs)', head: 'Infrastructure', amount: '₹4,80,000', date: '02 Sep 2026', status: 'UNDER_REVIEW', geoPhoto: 'Required' },
    { id: 'INV-2026-084', vendor: 'Direct Student Bank Transfers (Stipend Sept)', head: 'Beneficiary Stipend', amount: '₹1,50,000', date: '01 Oct 2026', status: 'VERIFIED', geoPhoto: 'DBT Log' },
    { id: 'INV-2026-085', vendor: 'Shree Sai Utilities & Power', head: 'Admin Overheads', amount: '₹45,000', date: '03 Oct 2026', status: 'PENDING', geoPhoto: 'N/A' },
  ];

  return (
    <div className="space-y-6">
      {/* Institution Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-semibold">
              INSTITUTION PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">REG: NSTI-PUN-005</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">{orgName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phase 3, Hinjawadi Infotech Park, Pune, Maharashtra &bull; Scheme: DDU-GKY Rural Livelihoods Scheme
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Institutional Status</div>
          <div className="mt-1">
            <StatusBadge status="ACTIVE" />
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: Institution Overview */}
      {activeSubTab === 'ngo_overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Active Schemes Operated</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{myProjects.length || 1}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">DDU-GKY & PM-DAKSH</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Enrolled Beneficiaries</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{beneficiaries.length || 11}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">Active residential hostelers</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Today's Attendance Status</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">Ready</div>
              <div className="text-[11px] text-slate-500 mt-0.5">AI Camera Pipeline Online</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Compliance Directives</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{actions.length || 1}</div>
              <div className="text-[11px] text-amber-400/80 mt-0.5">Clarification requested</div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => onSelectSubTab('ngo_rollcall')}
              className="p-5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80 group-hover:scale-105 transition">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Capture Beneficiary Attendance</h3>
                  <p className="text-xs text-slate-400">Group Photo / Webcam &bull; Face Verification &bull; Auto Attendance Log</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => onSelectSubTab('ngo_staff')}
              className="p-5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/80 group-hover:scale-105 transition">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Staff Selfie Check-In</h3>
                  <p className="text-xs text-slate-400">Geofenced GPS Proximity &bull; Anti-Spoof Sharpness Verification</p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Notices Section */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
                Official Ministry Directives & Clarification Requests
              </h3>
              <span className="text-xs text-slate-400 font-mono">{actions.length} open</span>
            </div>

            {actions.map((act, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{act.title}</span>
                  <StatusBadge status={act.status} />
                </div>
                <p className="text-slate-400 leading-normal">{act.description}</p>
                <div className="text-[11px] text-amber-400 flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Required Evidence: {act.evidenceRequired}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Embedded Rollcall Workflow */}
      {activeSubTab === 'ngo_rollcall' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Daily Beneficiary Group Attendance Rollcall</h3>
              <p className="text-xs text-slate-400">AI face detection and verification pipeline</p>
            </div>
            <button
              onClick={() => onSelectSubTab('ngo_overview')}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              &larr; Back to Institution Overview
            </button>
          </div>
          <CaptureWorkflow onSessionFinalized={onRefreshData} />
        </div>
      )}

      {/* Sub-Tab 3: Embedded Staff Selfie Check-In */}
      {activeSubTab === 'ngo_staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Facility Staff Geofenced Selfie Check-In</h3>
              <p className="text-xs text-slate-400">Biometric presence & geo-tagging</p>
            </div>
            <button
              onClick={() => onSelectSubTab('ngo_overview')}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              &larr; Back to Institution Overview
            </button>
          </div>
          <StaffCheckin />
        </div>
      )}

      {/* Sub-Tab 4: Beneficiaries Sub-Tab */}
      {activeSubTab === 'ngo_beneficiaries' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Registered Beneficiaries Roster</h3>
              <p className="text-xs text-slate-400">Institutional Unit: St. Jude Residential Hostel (Pune)</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{beneficiaries.length} total</span>
          </div>

          <div className="divide-y divide-slate-800 text-xs bg-slate-950/60 rounded-xl border border-slate-800 p-2">
            {beneficiaries.map((b, idx) => (
              <div key={idx} className="py-2.5 px-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">{b.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{b.beneficiaryId} &bull; {b.category} &bull; Age {b.age} ({b.gender})</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                    {b.verifiedAttendanceSessions || 0} sessions verified
                  </span>
                  <StatusBadge status={b.eligibilityStatus || 'ELIGIBLE'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Financial Grant Utilization */}
      {activeSubTab === 'ngo_financial' && (
        <div className="space-y-5">
          {/* Main Financial Overview Banner */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Central Scheme Grant Utilization Summary</h3>
                <p className="text-slate-400 text-[11px]">Financial Year: 2025-2026 &bull; Scheme Sanction Order: DOSJE/2025/MH-PUN/882</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
                Quarter 3 Active
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Sanctioned Total Grant</span>
                <span className="text-lg font-bold text-slate-100 mt-0.5 block">₹25,00,000</span>
                <span className="text-[10px] text-slate-500">Ministry Approved Limit</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Disbursed Tranche 1 & 2</span>
                <span className="text-lg font-bold text-emerald-400 mt-0.5 block">₹20,00,000</span>
                <span className="text-[10px] text-emerald-400/80">80% of total sanction</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Claimed Expenditure</span>
                <span className="text-lg font-bold text-amber-400 mt-0.5 block">₹16,40,000</span>
                <span className="text-[10px] text-amber-400/80">82% of disbursed amount</span>
              </div>
            </div>

            {/* Clarification Alert Box */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 text-amber-300 space-y-2">
              <div className="font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Official Department Clarification Required (Rule 18 Audit Flag)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                The Ministry Automated Audit Engine noted that claimed financial expenditure velocity (<strong>82% of disbursed funds</strong>) is running significantly ahead of verified on-site milestone completion (<strong>43% verified infrastructure</strong>). To release the 3rd Tranche (₹5,00,000), please submit the CA certified Form GFR 12-A and geo-tagged photos of assets.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setUploadedCert(true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    uploadedCert
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40'
                  }`}
                >
                  {uploadedCert ? <Check className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                  {uploadedCert ? 'GFR 12-A Certificate Submitted & Hashed' : 'Upload CA Certificate (GFR 12-A PDF)'}
                </button>
                {uploadedCert && (
                  <span className="text-[10px] font-mono text-emerald-400">
                    SHA-256: 8f4b2c19e7a102... Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Budget Heads Breakdown */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100">Itemized Budget Heads & Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-slate-200 font-medium mb-1">
                  <span>1. Infrastructure & Hostel Facility Upgrades</span>
                  <span className="font-mono">₹10,50,000 / ₹10,50,000 (100%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-200 font-medium mb-1">
                  <span>2. Beneficiary Nutritional Mess & Direct Stipends</span>
                  <span className="font-mono">₹6,00,000 / ₹8,00,000 (75%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-200 font-medium mb-1">
                  <span>3. Vocational Training Hardware & Toolkits</span>
                  <span className="font-mono">₹2,70,000 / ₹4,50,000 (60%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-200 font-medium mb-1">
                  <span>4. Facility Operations & Administrative Overheads</span>
                  <span className="font-mono">₹90,000 / ₹2,00,000 (45%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Invoices & Vouchers Table */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Submitted Invoices & Proof of Expenditure</h3>
                <p className="text-slate-400 text-[11px]">All uploaded bills verified with GSTIN and geo-tagged proof</p>
              </div>
              <div className="flex items-center gap-1">
                {(['ALL', 'VERIFIED', 'PENDING'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveInvoiceFilter(filter)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono ${
                      activeInvoiceFilter === filter
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5 rounded-l">Invoice #</th>
                    <th className="p-2.5">Vendor / Payee</th>
                    <th className="p-2.5">Budget Head</th>
                    <th className="p-2.5">Amount</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Evidence</th>
                    <th className="p-2.5 rounded-r">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px]">
                  {invoices
                    .filter((inv) => activeInvoiceFilter === 'ALL' || inv.status === activeInvoiceFilter || (activeInvoiceFilter === 'PENDING' && inv.status === 'UNDER_REVIEW'))
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-950/40">
                        <td className="p-2.5 font-mono font-bold text-slate-200">{inv.id}</td>
                        <td className="p-2.5 text-slate-300">{inv.vendor}</td>
                        <td className="p-2.5 text-slate-400">{inv.head}</td>
                        <td className="p-2.5 font-mono text-slate-100 font-semibold">{inv.amount}</td>
                        <td className="p-2.5 text-slate-500">{inv.date}</td>
                        <td className="p-2.5 text-slate-400 font-mono text-[10px]">{inv.geoPhoto}</td>
                        <td className="p-2.5">
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 6: Field Inspections History */}
      {activeSubTab === 'ngo_inspections' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Field Inspections & Surprise Audits History</h3>
              <p className="text-slate-400 text-[11px]">Official inspection reports conducted by PMU Field Officers</p>
            </div>
            <span className="text-xs font-mono text-slate-400">2 recorded</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">INSP-2026-PUN-001 (Surprise Inspection)</span>
                <StatusBadge status="IN_PROGRESS" />
              </div>
              <p className="text-slate-400">
                Assigned Inspector: <strong>Amitabh Sharma</strong> &bull; Scheduled Date: <strong>Today (4 Oct 2026)</strong>
              </p>
              <div className="p-2.5 rounded-lg bg-sky-950/20 border border-sky-900/40 text-sky-300 text-[11px]">
                Surprise on-site verification in progress. Inspector is validating residential attendance roster and infrastructure facilities.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">INSP-2025-PUN-089 (Annual Scheme Audit)</span>
                <StatusBadge status="COMPLETED" />
              </div>
              <p className="text-slate-400">
                Inspector: Rajesh K. &bull; Date: 14 Nov 2025 &bull; Rating: 88/100 (Compliant)
              </p>
              <div className="text-[10px] font-mono text-emerald-400">
                SHA-256 Signed Audit Dossier Archived &bull; No critical non-compliance detected
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 7: Official Notices & Directives */}
      {activeSubTab === 'ngo_compliance' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Official Ministry Directives & Compliance Action Items</h3>
              <p className="text-slate-400 text-[11px]">Mandatory responses and corrective action submissions</p>
            </div>
            <span className="text-xs font-mono text-amber-400">{actions.length} action item</span>
          </div>

          <div className="space-y-3">
            {actions.map((act, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">{act.title}</span>
                  <StatusBadge status={act.status} />
                </div>
                <p className="text-slate-400 leading-relaxed">{act.description}</p>
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300 text-[11px] flex items-center justify-between">
                  <span>Required Action: {act.evidenceRequired}</span>
                  <span className="font-mono text-[10px]">Due: 15 Oct 2026</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

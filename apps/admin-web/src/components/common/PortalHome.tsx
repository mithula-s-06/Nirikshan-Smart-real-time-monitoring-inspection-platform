import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  ShieldAlert,
  FileCheck,
  Users,
  Camera,
  ClipboardCheck,
  MapPin,
  CheckSquare,
  UploadCloud,
  UserCheck,
  Clock,
  HelpCircle,
  Building,
  Coins,
  Landmark,
  Search,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Permissions } from '@nirikshan/shared-types';

export type PortalKind = 'official' | 'ngo' | 'inspector' | 'beneficiary';

interface TileDef {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // tailwind bg class
  permission?: string;
}

const TILES: Record<PortalKind, TileDef[]> = {
  official: [
    { id: 'command', label: 'DASHBOARD', hint: 'Situation room', icon: LayoutDashboard, color: 'bg-[#0b2a6b]' },
    { id: 'projects', label: 'SCHEMES', hint: 'Projects & geofences', icon: Briefcase, color: 'bg-[#f58a3c]', permission: Permissions.PROJECT_VIEW },
    { id: 'anomalies', label: 'ANOMALIES', hint: 'Human-review queue', icon: ShieldAlert, color: 'bg-[#7fb5a4]', permission: Permissions.ANOMALY_VIEW },
    { id: 'compliance', label: 'REPORTS', hint: 'Compliance & audit', icon: FileCheck, color: 'bg-[#4a97ab]', permission: Permissions.COMPLIANCE_VIEW },
  ],
  ngo: [
    { id: 'ngo_overview', label: 'DASHBOARD', hint: 'Institution overview', icon: LayoutDashboard, color: 'bg-[#0b2a6b]' },
    { id: 'ngo_beneficiaries', label: 'BENEFICIARIES', hint: 'Active enrolments', icon: Users, color: 'bg-[#f58a3c]' },
    { id: 'ngo_rollcall', label: 'ATTENDANCE', hint: 'AI roll-call', icon: Camera, color: 'bg-[#7fb5a4]' },
    { id: 'ngo_compliance', label: 'NOTICES', hint: 'Directives & replies', icon: FileCheck, color: 'bg-[#4a97ab]' },
  ],
  inspector: [
    { id: 'inspector_assignments', label: 'MY MISSIONS', hint: 'Assigned inspections', icon: ClipboardCheck, color: 'bg-[#0b2a6b]' },
    { id: 'inspector_today', label: 'TODAY', hint: 'Geofenced check-in', icon: MapPin, color: 'bg-[#f58a3c]' },
    { id: 'inspector_checklist', label: 'CHECKLIST', hint: 'Digital form', icon: CheckSquare, color: 'bg-[#7fb5a4]' },
    { id: 'inspector_evidence', label: 'EVIDENCE', hint: 'Hashed uploads', icon: UploadCloud, color: 'bg-[#4a97ab]' },
  ],
  beneficiary: [
    { id: 'ben_profile', label: 'MY PROFILE', hint: 'Citizen record', icon: UserCheck, color: 'bg-[#0b2a6b]' },
    { id: 'ben_scheme', label: 'MY SCHEME', hint: 'Entitlements', icon: Briefcase, color: 'bg-[#f58a3c]' },
    { id: 'ben_attendance', label: 'ATTENDANCE', hint: 'My record', icon: Clock, color: 'bg-[#7fb5a4]' },
    { id: 'ben_support', label: 'GRIEVANCE', hint: 'Help & support', icon: HelpCircle, color: 'bg-[#4a97ab]' },
  ],
};

const WELCOME: Record<PortalKind, { eyebrow: string; title: string; text: string }> = {
  official: {
    eyebrow: 'MONITORING & CONTROL CENTRE',
    title: 'Capture · Validate · Analyze · Detect · Verify · Alert · Act',
    text: 'AI assists the official; it never decides. Every high-risk signal goes through human review and is audit-logged.',
  },
  ngo: {
    eyebrow: 'INSTITUTION WORKSPACE',
    title: 'Your institution, attendance, grants and notices in one place',
    text: 'Only records belonging to your organisation are visible here. Submit evidence and respond to directives before due dates.',
  },
  inspector: {
    eyebrow: 'FIELD INSPECTOR PORTAL',
    title: 'Assigned missions with geofenced check-in and hashed evidence',
    text: 'You see only inspections assigned to you. Location, photos and checklist answers are time-stamped and tamper-evident.',
  },
  beneficiary: {
    eyebrow: 'CITIZEN BENEFICIARY PORTAL',
    title: 'Your scheme entitlements, attendance and grievances',
    text: 'You can view only your own record. Sensitive identifiers such as Aadhaar are masked.',
  },
};

export function portalKindFromRoles(hasRole: (r: string) => boolean): PortalKind {
  if (hasRole(UserRole.BENEFICIARY)) return 'beneficiary';
  if (hasRole(UserRole.PMU_INSPECTOR)) return 'inspector';
  if (hasRole(UserRole.NGO_ADMIN) || hasRole(UserRole.NGO_PROJECT_MANAGER) || hasRole(UserRole.NGO_STAFF)) return 'ngo';
  return 'official';
}

/** Welcome banner + four coloured quick-access tiles (role specific). */
export const PortalHero: React.FC<{
  kind: PortalKind;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}> = ({ kind, activeTab, onSelectTab }) => {
  const { user, hasPermission } = useAuth();
  const w = WELCOME[kind];
  const tiles = TILES[kind].filter((t) => !t.permission || hasPermission(t.permission));

  return (
    <div className="space-y-5 mb-6">
      <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-[#0b2a6b] via-[#14398f] to-[#4a97ab] text-white p-6 flex items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 max-w-3xl">
          <div className="text-[11px] font-bold tracking-[0.2em] text-[#f58a3c]">{w.eyebrow}</div>
          <h2 className="text-lg md:text-xl font-bold leading-snug !text-white">{w.title}</h2>
          <p className="text-xs text-white/90 leading-relaxed">{w.text}</p>
          <div className="text-[11px] text-white/80">
            Signed in as <span className="font-semibold text-white">{user?.name}</span>
            {user?.designation ? <> &bull; {user.designation}</> : null}
          </div>
        </div>
        <div className="hidden md:flex w-20 h-20 rounded-full border-2 border-white/40 items-center justify-center bg-white/10 shrink-0">
          <Landmark className="w-10 h-10 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`portal-tile ${t.color} rounded-2xl py-4 px-3 flex flex-col items-center gap-2 text-white shadow-md hover:shadow-lg transition cursor-pointer ${
                active ? 'ring-4 ring-[#f58a3c]/70' : ''
              }`}
            >
              <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-inner">
                <Icon className="w-5 h-5 text-[#0b2a6b]" />
              </span>
              <span className="text-xs font-bold tracking-wide !text-white">{t.label}</span>
              <span className="text-[10px] text-white/90">{t.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Functional "coverage" filter bar (light-blue strip). Filters re-query the backend. */
export const CoverageFilterBar: React.FC<{
  stateValue: string;
  riskValue: string;
  statusValue: string;
  onChange: (f: { state?: string; risk?: string; status?: string }) => void;
  onSearch: () => void;
  onReset: () => void;
  count: number;
}> = ({ stateValue, riskValue, statusValue, onChange, onSearch, onReset, count }) => (
  <div className="rounded-xl overflow-hidden border border-[#d6deec] bg-white shadow-sm">
    <div className="bg-[#0b2a6b] text-white text-[11px] font-bold px-4 py-2 tracking-wide flex items-center justify-between">
      <span>COVERAGE OF MONITORING</span>
      <span className="text-[#bcd4fb] text-[10px] font-medium">{count} institutions in active jurisdiction</span>
    </div>
    <div className="bg-[#e8f0fe] px-4 py-3 flex flex-wrap items-end gap-4 text-xs">
      <label className="flex flex-col gap-1 font-bold text-[#0f2147]">
        Select State
        <select
          value={stateValue}
          onChange={(e) => onChange({ state: e.target.value })}
          className="px-3 py-1.5 rounded bg-white border border-[#b7c3d8] min-w-40 font-normal text-[#0f2147] focus:outline-none focus:border-[#0b2a6b]"
        >
          <option value="">Select All States</option>
          <option>Maharashtra</option>
          <option>Delhi</option>
          <option>Karnataka</option>
          <option>Tamil Nadu</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 font-bold text-[#0f2147]">
        Risk Level
        <select
          value={riskValue}
          onChange={(e) => onChange({ risk: e.target.value })}
          className="px-3 py-1.5 rounded bg-white border border-[#b7c3d8] min-w-40 font-normal text-[#0f2147] focus:outline-none focus:border-[#0b2a6b]"
        >
          <option value="">Select All Levels</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 font-bold text-[#0f2147]">
        Status
        <select
          value={statusValue}
          onChange={(e) => onChange({ status: e.target.value })}
          className="px-3 py-1.5 rounded bg-white border border-[#b7c3d8] min-w-40 font-normal text-[#0f2147] focus:outline-none focus:border-[#0b2a6b]"
        >
          <option value="">Select All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </label>
      <button
        onClick={onSearch}
        className="px-4 py-1.5 rounded bg-[#071d4d] text-white font-bold flex items-center gap-1.5 hover:bg-[#0b2a6b] transition cursor-pointer"
      >
        <Search className="w-3.5 h-3.5" /> Search
      </button>
      <button
        onClick={onReset}
        className="px-4 py-1.5 rounded bg-[#1677ff] text-white font-bold flex items-center gap-1.5 hover:bg-[#0f63d6] transition cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Reset
      </button>
    </div>
  </div>
);

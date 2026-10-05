import React, { useState } from 'react';
import {
  Search,
  Bell,
  Layers,
  LogOut,
  Monitor,
  ChevronDown,
  Sparkles,
  Home,
  Wifi,
  WifiOff,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataScopeLevel } from '@nirikshan/shared-types';
import { NationalEmblem } from './NationalEmblem';
import { GIGWTopStrip } from './GIGWTopStrip';

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  backendOnline: boolean;
  unreadAlertsCount: number;
  onOpenNotifications: () => void;
  onOpenArchitecture?: () => void;
  onOpenSessions?: () => void;
  onOpenPersonaSwitcher?: () => void;
  onGoHome?: () => void;
  onSkipToContent?: () => void;
}

/** Authentic Government of India Ministry & Department Emblem Block */
export const PortalEmblem: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="flex items-center gap-3 bg-white pr-4 select-none">
    <NationalEmblem size={compact ? 'sm' : 'md'} variant="navy" showMotto={true} />
    <div className="leading-tight">
      <div className="text-[12px] font-bold text-[#0b2a6b] tracking-wide">
        सामाजिक न्याय और अधिकारिता विभाग
      </div>
      <div className="text-[11.5px] font-bold text-[#0f2147] tracking-tight">
        Department of Social Justice and Empowerment
      </div>
      <div className="text-[9.5px] text-[#4d5d7c] font-medium flex items-center gap-1">
        <span>Ministry of Social Justice and Empowerment</span>
        <span>•</span>
        <span className="font-semibold text-[#0b2a6b]">Govt. of India</span>
      </div>
    </div>
  </div>
);

export const Topbar: React.FC<TopbarProps> = ({
  searchQuery,
  onSearchChange,
  backendOnline,
  unreadAlertsCount,
  onOpenNotifications,
  onOpenArchitecture,
  onOpenSessions,
  onOpenPersonaSwitcher,
  onGoHome,
  onSkipToContent,
}) => {
  const { user, scope, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const jurisdiction = (() => {
    if (!scope || scope.level === DataScopeLevel.NATIONAL) return 'National HQ';
    if (scope.level === DataScopeLevel.STATE) return `State: ${user?.state || 'Assigned'}`;
    if (scope.level === DataScopeLevel.DISTRICT) return `District: ${user?.district || 'Assigned'}`;
    if (scope.level === DataScopeLevel.ORGANIZATION) return 'NGO / Institution';
    if (scope.level === DataScopeLevel.ASSIGNED_INSPECTIONS) return 'PMU Inspector';
    if (scope.level === DataScopeLevel.SELF) return 'Citizen Beneficiary';
    return 'Authorized User';
  })();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'OF';

  return (
    <header className="sticky top-0 z-30 shadow-md">
      {/* 🇮🇳 GIGW 3.0 Standard Accessibility & Tricolor Banner */}
      <GIGWTopStrip onSkipToContent={onSkipToContent} />

      {/* Main White Identity Strip */}
      <div className="h-[4.5rem] bg-white border-b border-[#d6deec] px-6 flex items-center justify-between shadow-sm">
        <PortalEmblem compact />

        {/* Center Portal Name Badge */}
        <div className="hidden md:flex flex-col items-center">
          <div className="px-5 py-1.5 rounded-xl bg-white border border-[#b7c3d8] shadow-sm text-sm font-extrabold text-[#0b2a6b] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NIRIKSHAN</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-[12px] font-semibold text-[#0f2147]">Real-Time Inspection &amp; Monitoring Platform</span>
          </div>
          <div className="text-[10px] text-[#4d5d7c] font-medium mt-1">
            Server-Enforced RBAC • Jurisdictional Data Scope • AI Anomaly Adjudication
          </div>
        </div>

        {/* Right Status & Branding Badges */}
        <div className="flex items-center gap-4">
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm ${
              backendOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}
          >
            {backendOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-red-600" />}
            {backendOnline ? 'LIVE API ONLINE' : 'BACKEND OFFLINE'}
          </div>

          <div className="hidden lg:block text-right leading-tight select-none">
            <div className="text-[10.5px] font-bold text-[#0b2a6b]">Azadi Ka Amrit Mahotsav</div>
            <div className="text-[10px] text-[#f58a3c] font-semibold">Digital India • Sunishchit Nirikshan</div>
          </div>
        </div>
      </div>

      {/* Official Navy Navigation Bar */}
      <div className="h-12 bg-[#0b2a6b] px-4 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center h-full">
          <button
            onClick={onGoHome}
            className="h-full px-5 flex items-center gap-1.5 bg-[#f58a3c] text-white text-xs font-bold hover:bg-[#e0701f] transition cursor-pointer"
            title="Navigate to Home Dashboard"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </button>
          <span className="hidden md:flex h-full items-center px-5 text-xs font-semibold text-white/95 border-r border-white/15">
            {user?.designation || 'Official Workspace'}
          </span>
          <span className="hidden lg:flex items-center ml-3 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[10px] font-bold text-white shadow-inner">
            {jurisdiction}
          </span>
        </div>

        {/* Jurisdiction Search Input */}
        <div className="hidden md:flex items-center max-w-sm w-full">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facilities, projects, or inspectors..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-xs !text-white placeholder-white/70 focus:outline-none focus:bg-white/25 focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-2 h-full">
          {onOpenArchitecture && (
            <button
              onClick={onOpenArchitecture}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/95 hover:bg-white/15 text-xs font-semibold transition cursor-pointer"
              title="View Platform Architecture & Verification Engine"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>Architecture</span>
            </button>
          )}

          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-white hover:bg-white/15 transition cursor-pointer"
            title="System Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#f58a3c] text-[10px] font-extrabold text-white flex items-center justify-center shadow">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Official Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/15 transition text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-white text-[#0b2a6b] flex items-center justify-center text-[11px] font-extrabold shadow-sm">
                {initials}
              </div>
              <div className="hidden lg:block text-xs leading-tight">
                <div className="font-bold text-white">{user?.name || 'Authorized Official'}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#d6deec] shadow-2xl p-4 z-50 text-xs space-y-3">
                <div className="border-b border-[#e2e8f0] pb-3">
                  <div className="font-bold text-[#0f2147] text-sm">{user?.name}</div>
                  <div className="text-[#4d5d7c] text-[11px] truncate">{user?.email}</div>
                  <div className="text-[#6b7a96] text-[11px] font-medium">{user?.designation}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200">
                      {jurisdiction}
                    </span>
                    <span className="text-[10px] text-[#4d5d7c] font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      ID: {user?.id?.slice(-6) || 'AUTH'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {onOpenSessions && (
                    <button
                      onClick={() => { setProfileOpen(false); onOpenSessions(); }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 text-[#0f2147] transition flex items-center gap-2 text-left font-medium cursor-pointer"
                    >
                      <Monitor className="w-3.5 h-3.5 text-[#0b2a6b]" />
                      <span>Active Sessions &amp; Security Audits</span>
                    </button>
                  )}
                  {onOpenPersonaSwitcher && (
                    <button
                      onClick={() => { setProfileOpen(false); onOpenPersonaSwitcher(); }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-amber-50 text-[#0f2147] transition flex items-center gap-2 text-left font-medium cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#f58a3c]" />
                      <span>Switch Persona (Evaluation Benchmark)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => { setProfileOpen(false); logout(); }}
            className="h-9 px-4 rounded-lg bg-[#f58a3c] hover:bg-[#e0701f] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

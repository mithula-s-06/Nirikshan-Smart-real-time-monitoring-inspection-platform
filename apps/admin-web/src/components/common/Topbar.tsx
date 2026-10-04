import React, { useState } from 'react';
import {
  Search,
  Bell,
  Layers,
  LogOut,
  Monitor,
  ChevronDown,
  Sparkles,
  Landmark,
  Home,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataScopeLevel } from '@nirikshan/shared-types';

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
}

/** Emblem block used on both the login screen and the main header. */
export const PortalEmblem: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="flex items-center gap-3 bg-white pr-4">
    <div
      className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full border-2 border-[#0b2a6b] flex items-center justify-center bg-white text-[#0b2a6b] shrink-0 shadow-sm`}
      title="Satyameva Jayate"
    >
      <Landmark className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
    </div>
    <div className="leading-tight">
      <div className="text-[13px] font-bold text-[#0f2147]">Department of Social Justice &amp; Empowerment</div>
      <div className="text-[10px] text-[#4d5d7c] font-medium">Ministry of Social Justice &amp; Empowerment</div>
      <div className="text-[10px] text-[#4d5d7c] font-semibold">Government of India</div>
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
      {/* White identity strip */}
      <div className="h-[4.25rem] bg-white border-b border-slate-800 px-6 flex items-center justify-between">
        <PortalEmblem compact />

        <div className="hidden md:flex flex-col items-center">
          <div className="px-5 py-1.5 rounded-xl bg-white border border-slate-800 shadow-sm text-sm font-bold text-slate-100">
            NIRIKSHAN Monitoring &amp; Intelligence Portal
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Server-enforced identity &bull; RBAC &bull; Jurisdictional data scope
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              backendOnline
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-red-950 text-red-400 border-red-800'
            }`}
          >
            {backendOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {backendOnline ? 'LIVE API' : 'BACKEND OFFLINE'}
          </div>
          <div className="hidden lg:block text-right leading-tight">
            <div className="text-[10px] font-bold text-portal-navy">Azadi Ka Amrit Mahotsav</div>
            <div className="text-[10px] text-portal-orange font-semibold">Digital India &bull; Sunishchit Nirikshan</div>
          </div>
        </div>
      </div>

      {/* Navy navigation bar */}
      <div className="h-12 bg-portal-navy px-4 flex items-center justify-between gap-3">
        <div className="flex items-center h-full">
          <button
            onClick={onGoHome}
            className="h-full px-5 flex items-center gap-1.5 bg-portal-orange text-white text-xs font-bold hover:bg-portal-orangeDark transition"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </button>
          <span className="hidden md:flex h-full items-center px-5 text-xs font-medium text-white/90">
            {user?.designation || 'Official Workspace'}
          </span>
          <span className="hidden lg:flex items-center ml-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[10px] font-semibold text-white">
            {jurisdiction}
          </span>
        </div>

        <div className="hidden md:flex items-center max-w-xs w-full">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search within your jurisdiction..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/10 border border-white/25 text-xs !text-white placeholder-white/60 focus:outline-none focus:bg-white/20 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 h-full">
          {onOpenArchitecture && (
            <button
              onClick={onOpenArchitecture}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/90 hover:bg-white/10 text-xs font-medium transition"
              title="System architecture"
            >
              <Layers className="w-3.5 h-3.5" /> Architecture
            </button>
          )}

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-white hover:bg-white/10 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-portal-orange text-[10px] font-bold text-white flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition text-left"
            >
              <div className="w-7 h-7 rounded-full bg-white text-portal-navy flex items-center justify-center text-[11px] font-bold">
                {initials}
              </div>
              <div className="hidden lg:block text-xs leading-tight">
                <div className="font-semibold text-white">{user?.name || 'Authorized Official'}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-800 shadow-portal p-4 z-50 text-xs space-y-3">
                <div className="border-b border-slate-800 pb-3">
                  <div className="font-bold text-slate-100 text-sm">{user?.name}</div>
                  <div className="text-slate-400 text-[11px] truncate">{user?.email}</div>
                  <div className="text-slate-500 text-[11px]">{user?.designation}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-indigo-950 text-indigo-300 border-indigo-800">
                      {jurisdiction}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {user?.id?.slice(-6) || 'AUTH'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {onOpenSessions && (
                    <button
                      onClick={() => { setProfileOpen(false); onOpenSessions(); }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-slate-950 text-slate-200 transition flex items-center gap-2 text-left"
                    >
                      <Monitor className="w-3.5 h-3.5 text-portal-navy" />
                      <span>Active Sessions &amp; Security</span>
                    </button>
                  )}
                  {onOpenPersonaSwitcher && (
                    <button
                      onClick={() => { setProfileOpen(false); onOpenPersonaSwitcher(); }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-slate-950 text-slate-200 transition flex items-center gap-2 text-left"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-portal-orange" />
                      <span>Switch Persona (Evaluator Test)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { setProfileOpen(false); logout(); }}
            className="h-9 px-4 rounded-lg bg-portal-orange hover:bg-portal-orangeDark text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

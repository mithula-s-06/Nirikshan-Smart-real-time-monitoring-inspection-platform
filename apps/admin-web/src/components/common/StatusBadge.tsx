import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'risk' | 'status' | 'verification' | 'action';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status', size = 'sm' }) => {
  const s = (status || '').toUpperCase();

  let bg = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'CRITICAL' || s === 'BLACKLISTED' || s === 'FAILED' || s === 'OVERDUE') {
    bg = 'bg-red-950/80 text-red-300 border-red-800/80';
  } else if (s === 'HIGH' || s === 'GRANT_SUSPENDED' || s === 'FLAGGED' || s === 'ACTION_REQUIRED') {
    bg = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
  } else if (s === 'MEDIUM' || s === 'UNDER_REVIEW' || s === 'INVESTIGATING' || s === 'IN_PROGRESS') {
    bg = 'bg-sky-950/80 text-sky-300 border-sky-800/80';
  } else if (s === 'LOW' || s === 'VERIFIED' || s === 'ACTIVE' || s === 'CLOSED' || s === 'COMPLETED' || s === 'ELIGIBLE') {
    bg = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
  } else if (s === 'OFFLINE') {
    bg = 'bg-slate-900 text-slate-400 border-slate-700';
  } else if (s === 'LIVE' || s === 'ONLINE') {
    bg = 'bg-emerald-900/60 text-emerald-400 border-emerald-700 animate-pulse';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium font-mono uppercase rounded border tracking-wider ${px} ${bg}`}>
      {s.replace(/_/g, ' ')}
    </span>
  );
};

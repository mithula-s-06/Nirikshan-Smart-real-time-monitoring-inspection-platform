import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AccessDeniedProps {
  requiredPermission?: string;
  onGoHome?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission = 'authorized.access',
  onGoHome,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 shadow-xl shadow-red-950/40">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <div className="text-[11px] font-mono uppercase text-red-400 font-bold tracking-widest">
          HTTP 403 &bull; ACCESS RESTRICTED
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          Jurisdiction & Permission Restricted
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your authenticated government account does not hold the required privileges to view or modify this resource.
        </p>
      </div>

      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-amber-400" />
        <span>Required Permission: <code className="text-indigo-400">{requiredPermission}</code></span>
      </div>

      <p className="text-[11px] text-slate-500 max-w-sm">
        If you require operational access to this state, district, or domain module, please contact your Department Nodal Officer for temporary elevated delegation.
      </p>

      {onGoHome && (
        <button
          onClick={onGoHome}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Authorized Workspace</span>
        </button>
      )}
    </div>
  );
};

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Shield, Smartphone, Monitor, Clock, Globe, Trash2, CheckCircle2 } from 'lucide-react';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({ isOpen, onClose }) => {
  const { user, activeSessions, fetchSessions, revokeSession } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[85vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Active Login Sessions</h3>
              <p className="text-[11px] text-slate-400">Manage authenticated devices and remote session termination</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Identity Info */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-slate-200">{user?.name}</div>
            <div className="text-[11px] text-slate-400">{user?.email} &bull; {user?.designation || user?.role}</div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
            ACCOUNT ACTIVE
          </span>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-1">
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No other active sessions detected.
            </div>
          ) : (
            activeSessions.map((s, idx) => (
              <div
                key={s._id || s.id || idx}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    {s.deviceInfo?.includes('Mobile') ? (
                      <Smartphone className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Monitor className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>{s.deviceInfo || 'Web Browser'}</span>
                      {idx === 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-500" />
                        {s.ipAddress}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(s.lastActiveAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {idx !== 0 && (
                  <button
                    onClick={() => revokeSession(s._id || s.id)}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 text-xs transition flex items-center gap-1"
                    title="Terminate Session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Revoke</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>Automatic timeout after inactivity</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

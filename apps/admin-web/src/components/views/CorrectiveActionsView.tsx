import React, { useState } from 'react';
import { CheckSquare, AlertTriangle, Clock, CheckCircle, Plus, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface CorrectiveActionsViewProps {
  actions: any[];
  stats: any;
  loading: boolean;
  onUpdateStatus: (actionId: string, status: string, remarks?: string) => Promise<void>;
  onCreateAction: (actionData: any) => Promise<void>;
}

export const CorrectiveActionsView: React.FC<CorrectiveActionsViewProps> = ({
  actions,
  stats,
  loading,
  onUpdateStatus,
  onCreateAction,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAuthority, setNewAuthority] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newEvidence, setNewEvidence] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthority || !newDeadline) return;
    await onCreateAction({
      title: newTitle,
      description: newDesc,
      responsibleAuthority: newAuthority,
      deadline: newDeadline,
      priority: newPriority,
      evidenceRequired: newEvidence,
    });
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewAuthority('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Corrective Action Management & Remediation Lifecycle</h2>
            <p className="text-xs text-slate-400">
              Legally binding directives issued to institutions upon verified anomaly adjudication. Track remediation through to verification.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" /> Issue Directive
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Directives Issued</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{stats?.total || actions.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Formal compliance notices</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Active Remediation In Progress</div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{stats?.inProgress || 1}</div>
          <div className="text-[11px] text-sky-400/80 mt-0.5">Institution submitting logs</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Overdue Directives</div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">{stats?.overdue || 1}</div>
          <div className="text-[11px] text-red-400/80 mt-0.5">Past statutory deadline</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Resolved & Verified</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{stats?.closed || 0}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Remediation confirmed on site</div>
        </div>
      </div>

      {/* Actions Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
            Active Institutional Corrective Directives
          </h3>
          <span className="text-xs text-slate-500 font-mono">{actions.length} directives</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Directive Code / Title</th>
                <th className="p-3.5">Responsible Authority</th>
                <th className="p-3.5">Deadline</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Required Evidence</th>
                <th className="p-3.5">Adjudicate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No active corrective actions recorded.
                  </td>
                </tr>
              ) : (
                actions.map((act) => (
                  <tr key={act.id || act._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{act.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{act.actionNumber}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {act.responsibleAuthority}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {new Date(act.deadline).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={act.priority} type="risk" />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={act.status} />
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400 max-w-xs truncate" title={act.evidenceRequired}>
                      {act.evidenceRequired}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        {act.status !== 'VERIFIED' && act.status !== 'CLOSED' && (
                          <button
                            onClick={() => onUpdateStatus(act.id || act._id, 'VERIFIED', 'Verified compliant by DoSJE officer')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition"
                          >
                            Mark Verified
                          </button>
                        )}
                        {act.status === 'OPEN' && (
                          <button
                            onClick={() => onUpdateStatus(act.id || act._id, 'IN_PROGRESS', 'Institution acknowledged and began submission')}
                            className="px-2.5 py-1 rounded bg-sky-800 hover:bg-sky-700 text-sky-200 font-medium text-[11px] transition"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Directive Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              Issue Formal Corrective Action Directive
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Directive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reconcile Classroom Rollcall Deficit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Responsible Authority / Institution Head</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Skill Training Institute Pune (Project Director)"
                  value={newAuthority}
                  onChange={(e) => setNewAuthority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Compliance Deadline</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Evidence Required from Institution</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Signed physical attendance register + CA utilization certificate"
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
                >
                  Issue Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

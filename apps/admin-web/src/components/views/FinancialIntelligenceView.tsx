import React, { useState } from 'react';
import { Coins, AlertTriangle, CheckCircle, FileText, TrendingUp, ShieldAlert, Sparkles, Building } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface FinancialIntelligenceViewProps {
  financialRecords: any[];
  stats: any;
  onRunAudit: (projectId: string) => Promise<void>;
  onSelectProject: (project: any) => void;
  loading: boolean;
}

export const FinancialIntelligenceView: React.FC<FinancialIntelligenceViewProps> = ({
  financialRecords,
  stats,
  onRunAudit,
  onSelectProject,
  loading,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [auditingId, setAuditingId] = useState<string | null>(null);

  const handleAuditClick = async (projectId: string) => {
    setAuditingId(projectId);
    try {
      await onRunAudit(projectId);
    } finally {
      setAuditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Financial Intelligence & Grant Audit Engine</h2>
            <p className="text-xs text-slate-400">
              Rules 16–22 &bull; Expenditure per attendee MAD, ceiling breaches, duplicate invoice hashes, and physical progress burn mismatch.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800/80 uppercase font-semibold">
          DECISION SUPPORT ONLY
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Sanctioned Grants</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            ₹{stats?.totalSanctioned?.toLocaleString('en-IN') || '43,00,000'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across monitored projects</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Funds Disbursed</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            ₹{stats?.totalDisbursed?.toLocaleString('en-IN') || '32,00,000'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Central treasury release</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Claimed Expenditure</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            ₹{stats?.totalExpenditure?.toLocaleString('en-IN') || '23,80,000'}
          </div>
          <div className="text-[11px] text-amber-400 font-mono mt-0.5">
            Burn Rate: {stats?.overallBurnRatePercent || 74}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Flagged Invoices / Ceiling Breaches</div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">
            {stats?.flaggedInvoicesCount || 2}
          </div>
          <div className="text-[11px] text-red-400/80 mt-0.5">Split procurement ceiling alerts</div>
        </div>
      </div>

      {/* Financial Audit Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
            Project Financial Burn & Physical Progress Matrix
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {financialRecords.length} records analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Project / Institution</th>
                <th className="p-3.5">Sanctioned</th>
                <th className="p-3.5">Financial Burn</th>
                <th className="p-3.5">Physical Progress</th>
                <th className="p-3.5">Progress Deficit</th>
                <th className="p-3.5">Risk Score</th>
                <th className="p-3.5">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {financialRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No financial audit records available. Ensure backend is running.
                  </td>
                </tr>
              ) : (
                financialRecords.map((r) => {
                  const burn = r.financialBurnPercent || 0;
                  const phys = r.verifiedPhysicalProgressPercent || 0;
                  const deficit = burn - phys;
                  const isSevere = deficit > 20;

                  return (
                    <tr key={r.id || r._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-100">{r.projectId?.name || 'Project Facility'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{r.projectId?.code || r.financialYear}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-200">
                        ₹{(r.totalSanctionedGrant || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className={burn > 80 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{burn}%</span>
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-amber-500 h-full" style={{ width: `${burn}%` }} />
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="text-emerald-400 font-bold">{phys}%</span>
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-emerald-500 h-full" style={{ width: `${phys}%` }} />
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        {isSevere ? (
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/80 font-bold">
                            +{deficit}% Deficit
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Normal ({deficit > 0 ? `+${deficit}%` : `${deficit}%`})</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          (r.riskScore || 0) >= 60
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {r.riskScore || 0} / 100
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAuditClick(r.projectId?.id || r.projectId?._id || r.projectId)}
                            disabled={auditingId === (r.projectId?.id || r.projectId?._id || r.projectId)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition shadow-sm"
                          >
                            {auditingId === (r.projectId?.id || r.projectId?._id || r.projectId) ? 'Auditing...' : 'Run Audit'}
                          </button>
                          <button
                            onClick={() => setSelectedRecord(r)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                          >
                            Invoices ({r.invoices?.length || 0})
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Inspection Drawer / Modal */}
      {selectedRecord && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200">
                Detailed Invoice Ledger & Split Procurement Audit
              </h4>
              <p className="text-xs text-slate-400">
                {selectedRecord.projectId?.name || 'Project'} &bull; FY {selectedRecord.financialYear}
              </p>
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close Ledger
            </button>
          </div>

          <div className="space-y-2">
            {selectedRecord.invoices?.map((inv: any, idx: number) => (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border text-xs flex items-start justify-between ${
                  inv.isFlagged
                    ? 'bg-red-950/20 border-red-900/60 text-red-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-100">{inv.invoiceNumber}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({inv.date})</span>
                    {inv.isFlagged && (
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-mono">
                        FLAGGED: SPLIT CEILING
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 mt-1 font-medium">{inv.vendorName} &bull; GSTIN: {inv.vendorGstin}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{inv.description}</div>
                  {inv.flagReason && (
                    <div className="text-amber-400 text-[11px] mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{inv.flagReason}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-slate-100">
                    ₹{(inv.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">{inv.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

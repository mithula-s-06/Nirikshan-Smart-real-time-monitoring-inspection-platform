import React, { useState, useMemo } from 'react';
import {
  Coins,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Building,
  Search,
  Filter,
  Plus,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface FinancialIntelligenceViewProps {
  financialRecords: any[];
  stats: any;
  onRunAudit: (projectId: string) => Promise<any>;
  onSelectProject: (project: any) => void;
  loading: boolean;
  onRefresh?: () => void;
}

export const FinancialIntelligenceView: React.FC<FinancialIntelligenceViewProps> = ({
  financialRecords,
  stats,
  onRunAudit,
  onSelectProject,
  loading,
  onRefresh,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<'invoices' | 'budgetHeads' | 'anomalies'>('invoices');
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [auditResultModal, setAuditResultModal] = useState<any | null>(null);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'SEVERE' | 'HIGH_RISK' | 'NORMAL'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [invoiceFilter, setInvoiceFilter] = useState<'ALL' | 'FLAGGED'>('ALL');

  // Add Invoice Modal State
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [targetRecordForInvoice, setTargetRecordForInvoice] = useState<any | null>(null);
  const [invNumber, setInvNumber] = useState('');
  const [invVendor, setInvVendor] = useState('');
  const [invGstin, setInvGstin] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().substring(0, 10));
  const [invCategory, setInvCategory] = useState('CONSUMABLES');
  const [invDescription, setInvDescription] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceSuccessMsg, setInvoiceSuccessMsg] = useState<string | null>(null);

  // Syncing all projects state
  const [syncingAll, setSyncingAll] = useState(false);

  // Available states for filter
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    financialRecords.forEach((r) => {
      const state = r.projectId?.state || r.organizationId?.state;
      if (state) set.add(state);
    });
    return Array.from(set).sort();
  }, [financialRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return financialRecords.filter((r) => {
      const projName = r.projectId?.name || '';
      const projCode = r.projectId?.code || '';
      const scheme = r.projectId?.scheme || '';
      const orgName = r.organizationId?.name || '';
      const state = r.projectId?.state || r.organizationId?.state || '';

      const matchesSearch =
        searchQuery === '' ||
        projName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orgName.toLowerCase().includes(searchQuery.toLowerCase());

      const burn = r.financialBurnPercent || 0;
      const phys = r.verifiedPhysicalProgressPercent || 0;
      const deficit = burn - phys;
      const riskScore = r.riskScore || 0;

      let matchesRisk = true;
      if (riskFilter === 'SEVERE') matchesRisk = deficit > 20;
      else if (riskFilter === 'HIGH_RISK') matchesRisk = riskScore >= 60;
      else if (riskFilter === 'NORMAL') matchesRisk = deficit <= 20 && riskScore < 60;

      const matchesState = stateFilter === 'ALL' || state === stateFilter;

      return matchesSearch && matchesRisk && matchesState;
    });
  }, [financialRecords, searchQuery, riskFilter, stateFilter]);

  const handleAuditClick = async (projectId: string) => {
    setAuditingId(projectId);
    try {
      const result = await onRunAudit(projectId);
      if (result) {
        setAuditResultModal(result);
      }
    } finally {
      setAuditingId(null);
    }
  };

  const handleSyncAllProjects = async () => {
    setSyncingAll(true);
    try {
      const token = localStorage.getItem('nirikshan_access_token');
      await fetch('/api/v1/financial/seed-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to sync projects:', err);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleOpenAddInvoice = (record: any) => {
    setTargetRecordForInvoice(record);
    setInvNumber(`INV-${Date.now().toString().slice(-4)}`);
    setInvVendor('');
    setInvGstin('');
    setInvAmount('');
    setInvDate(new Date().toISOString().substring(0, 10));
    setInvCategory('CONSUMABLES');
    setInvDescription('');
    setInvoiceError(null);
    setInvoiceSuccessMsg(null);
    setShowAddInvoiceModal(true);
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRecordForInvoice) return;
    if (!invVendor.trim() || !invAmount) {
      setInvoiceError('Vendor Name and Invoice Amount are required.');
      return;
    }

    setSubmittingInvoice(true);
    setInvoiceError(null);
    try {
      const token = localStorage.getItem('nirikshan_access_token');
      const res = await fetch(`/api/v1/financial/${targetRecordForInvoice.id || targetRecordForInvoice._id}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          invoiceNumber: invNumber.trim(),
          vendorName: invVendor.trim(),
          vendorGstin: invGstin.trim() || '27AAACP0000A1Z5',
          amount: parseFloat(invAmount),
          date: invDate,
          category: invCategory,
          description: invDescription.trim() || 'Operational equipment and consumable supplies',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit invoice');

      setInvoiceSuccessMsg('Invoice logged with SHA-256 verification hash!');
      if (selectedRecord && (selectedRecord.id === targetRecordForInvoice.id || selectedRecord._id === targetRecordForInvoice._id)) {
        setSelectedRecord(data.data.record);
      }
      setTimeout(() => {
        setShowAddInvoiceModal(false);
        if (onRefresh) onRefresh();
      }, 1000);
    } catch (err: any) {
      setInvoiceError(err.message || 'Submission failed');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/40 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">Financial Intelligence & Grant Audit Engine</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                ACTIVE MONITORING
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rules 16–22 &bull; Expenditure per attendee MAD, ceiling breaches, duplicate invoice hashes, and physical progress burn mismatch.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAllProjects}
            disabled={syncingAll}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition border border-slate-700"
            title="Auto-synchronize and audit all facilities across all states"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'Synchronizing...' : 'Sync All Facilities'}
          </button>
          <span className="text-[10px] font-mono px-2.5 py-1.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 uppercase font-semibold">
            RULES 16–22 ENFORCED
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Sanctioned Grants</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            ₹{(stats?.totalSanctioned || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across {financialRecords.length} monitored facilities</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Funds Disbursed</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            ₹{(stats?.totalDisbursed || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Central treasury release</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Claimed Expenditure</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            ₹{(stats?.totalExpenditure || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-400 font-mono mt-0.5">
            Overall Burn Rate: {stats?.overallBurnRatePercent || 0}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Flagged Split Invoices</div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">
            {stats?.flaggedInvoicesCount || 0}
          </div>
          <div className="text-[11px] text-red-400/80 mt-0.5">
            {stats?.highRiskCount || 0} facilities with critical deficits
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility name, project code, scheme, or NGO..."
            className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-200">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Audit Filter:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              <option value="ALL">All Projects ({financialRecords.length})</option>
              <option value="SEVERE">Severe Deficit &gt;20%</option>
              <option value="HIGH_RISK">High Risk Score &gt;=60</option>
              <option value="NORMAL">Normal Progress</option>
            </select>
          </div>

          {/* State Filter */}
          {availableStates.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">State:</span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none"
              >
                <option value="ALL">All States</option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          )}

          {(searchQuery || riskFilter !== 'ALL' || stateFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRiskFilter('ALL');
                setStateFilter('ALL');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Financial Audit Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
              Project Financial Burn & Physical Progress Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredRecords.length} of {financialRecords.length} facilities
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Project / Institution</th>
                <th className="p-3.5">Sanctioned</th>
                <th className="p-3.5">Disbursed</th>
                <th className="p-3.5">Financial Burn</th>
                <th className="p-3.5">Physical Progress</th>
                <th className="p-3.5">Progress Deficit</th>
                <th className="p-3.5">Risk Score</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No matching financial audit records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const burn = r.financialBurnPercent || 0;
                  const phys = r.verifiedPhysicalProgressPercent || 0;
                  const deficit = Math.round(burn - phys);
                  const isSevere = deficit > 20;
                  const projId = r.projectId?.id || r.projectId?._id || r.projectId;

                  return (
                    <tr key={r.id || r._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <button
                          onClick={() => onSelectProject(r.projectId)}
                          className="font-semibold text-slate-100 hover:text-indigo-400 transition text-left flex items-center gap-1.5 group"
                          title="View complete project facility dossier & linked beneficiaries"
                        >
                          <span>{r.projectId?.name || 'Project Facility'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span className="text-sky-400">{r.projectId?.code || 'PRJ-CODE'}</span>
                          <span>&bull;</span>
                          <span>{r.projectId?.district || 'District'}, {r.projectId?.state || 'State'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-200">
                        ₹{(r.totalSanctionedGrant || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono text-slate-200">
                        ₹{(r.totalDisbursedFunds || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className={burn > 80 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{burn}%</span>
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className={`h-full ${burn > 80 ? 'bg-amber-500' : 'bg-sky-500'}`} style={{ width: `${Math.min(100, burn)}%` }} />
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="text-emerald-400 font-bold">{phys}%</span>
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, phys)}%` }} />
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        {isSevere ? (
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/80 font-bold">
                            +{deficit}% Deficit
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">
                            Normal ({deficit > 0 ? `+${deficit}%` : `${deficit}%`})
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          (r.riskScore || 0) >= 60
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : (r.riskScore || 0) >= 35
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {r.riskScore || 0} / 100
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAuditClick(projId)}
                            disabled={auditingId === projId}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition shadow-sm flex items-center gap-1"
                            title="Execute Rules 16-22 live evaluation"
                          >
                            <Sparkles className="w-3 h-3" />
                            {auditingId === projId ? 'Auditing...' : 'Run Audit'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRecord(r);
                              setDrawerTab('invoices');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition flex items-center gap-1"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-amber-400" />
                            Ledger ({r.invoices?.length || 0})
                          </button>
                          <button
                            onClick={() => handleOpenAddInvoice(r)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition hover:text-white"
                            title="Upload new invoice to this grant ledger"
                          >
                            <Plus className="w-3.5 h-3.5" />
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
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-100">
                  {selectedRecord.projectId?.name || 'Project Facility'} &bull; Grant Ledger Dossier
                </h4>
                <span className="font-mono text-xs text-sky-400">
                  {selectedRecord.projectId?.code || selectedRecord.financialYear}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Financial Year: {selectedRecord.financialYear} &bull; Claimed Expenditure: ₹{(selectedRecord.totalExpenditure || 0).toLocaleString('en-IN')} &bull; Balance: ₹{(selectedRecord.closingBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAddInvoice(selectedRecord)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Invoice
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex items-center gap-4 border-b border-slate-800 text-xs">
            <button
              onClick={() => setDrawerTab('invoices')}
              className={`pb-2 font-medium transition border-b-2 ${
                drawerTab === 'invoices'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Invoices & Split Procurement ({selectedRecord.invoices?.length || 0})
            </button>
            <button
              onClick={() => setDrawerTab('budgetHeads')}
              className={`pb-2 font-medium transition border-b-2 ${
                drawerTab === 'budgetHeads'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Itemized Budget Heads ({selectedRecord.budgetHeads?.length || 0})
            </button>
            <button
              onClick={() => setDrawerTab('anomalies')}
              className={`pb-2 font-medium transition border-b-2 ${
                drawerTab === 'anomalies'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Rules Audit Flags ({selectedRecord.anomaliesDetected?.length || 0})
            </button>
          </div>

          {/* Tab 1: Invoices */}
          {drawerTab === 'invoices' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {selectedRecord.invoices?.length || 0} registered invoices on record
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Filter:</span>
                  <button
                    onClick={() => setInvoiceFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      invoiceFilter === 'ALL'
                        ? 'bg-slate-700 text-white font-medium'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setInvoiceFilter('FLAGGED')}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      invoiceFilter === 'FLAGGED'
                        ? 'bg-red-950 text-red-300 border border-red-800 font-medium'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Flagged Only ({selectedRecord.invoices?.filter((inv: any) => inv.isFlagged).length || 0})
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {(selectedRecord.invoices || [])
                  .filter((inv: any) => invoiceFilter === 'ALL' || inv.isFlagged)
                  .map((inv: any, idx: number) => (
                    <div
                      key={inv.id || idx}
                      className={`p-3.5 rounded-xl border text-xs flex items-start justify-between ${
                        inv.isFlagged
                          ? 'bg-red-950/20 border-red-900/60 text-red-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-100">{inv.invoiceNumber}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({inv.date})</span>
                          {inv.isFlagged ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-mono font-bold">
                              FLAGGED: RULE 20 CEILING SPLIT
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 font-medium">
                          {inv.vendorName} &bull; <span className="font-mono text-slate-400">GSTIN: {inv.vendorGstin}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">{inv.description}</div>
                        {inv.flagReason && (
                          <div className="text-amber-400 text-[11px] mt-1 flex items-center gap-1 font-mono">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{inv.flagReason}</span>
                          </div>
                        )}
                        {inv.documentHash && (
                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                            SHA-256: {inv.documentHash.substring(0, 24)}...
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-slate-100">
                          ₹{(inv.amount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                          {inv.category}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tab 2: Budget Heads */}
          {drawerTab === 'budgetHeads' && (
            <div className="space-y-3">
              {(selectedRecord.budgetHeads || []).map((head: any, idx: number) => {
                const util = head.utilizedAmount || 0;
                const sanc = head.sanctionedAmount || 1;
                const pct = Math.round((util / sanc) * 100);
                const isOver = util > sanc;

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{head.name}</span>
                      <div className="font-mono">
                        <span className={isOver ? 'text-red-400 font-bold' : 'text-slate-200'}>
                          ₹{util.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500"> / ₹{sanc.toLocaleString('en-IN')} ({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: Anomalies */}
          {drawerTab === 'anomalies' && (
            <div className="space-y-2 text-xs">
              {(selectedRecord.anomaliesDetected || []).length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>No active financial anomalies or ceiling breaches flagged for this grant.</span>
                </div>
              ) : (
                selectedRecord.anomaliesDetected.map((anom: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-200 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{anom}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Live AI Audit Results Modal */}
      {auditResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Financial Intelligence Audit Report (Rules 16–22)
                  </h3>
                  <p className="text-xs text-slate-400">
                    {auditResultModal.projectName || 'Facility Evaluation'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditResultModal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Evaluated Financial Risk Score</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${
                  auditResultModal.riskScore >= 60 ? 'text-red-400' :
                  auditResultModal.riskScore >= 35 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {auditResultModal.riskScore} / 100
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Progress Deficit</div>
                <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                  Burn {auditResultModal.financialBurnPercent}% vs Physical {auditResultModal.verifiedPhysicalProgressPercent}%
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {auditResultModal.findings?.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>All Rules 16–22 passed! No split procurement or progress burn anomalies detected.</span>
                </div>
              ) : (
                auditResultModal.findings?.map((f: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-300 font-mono">{f.ruleId}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 uppercase font-bold">
                        {f.severity}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200">{f.ruleName}</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{f.reason}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAuditResultModal(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddInvoiceModal && targetRecordForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Log New Grant Invoice</h3>
                <p className="text-xs text-slate-400">{targetRecordForInvoice.projectId?.name || 'Project Facility'}</p>
              </div>
              <button
                onClick={() => setShowAddInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {invoiceError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-900 text-red-300 text-xs">
                {invoiceError}
              </div>
            )}

            {invoiceSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                {invoiceSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSubmitInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Vendor / Contractor Name *</label>
                <input
                  type="text"
                  required
                  value={invVendor}
                  onChange={(e) => setInvVendor(e.target.value)}
                  placeholder="e.g. Apex Supplies Pvt Ltd"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Vendor GSTIN</label>
                  <input
                    type="text"
                    value={invGstin}
                    onChange={(e) => setInvGstin(e.target.value)}
                    placeholder="27AABCA1234F1Z5"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Invoice Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="250000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Expenditure Head / Category</label>
                <select
                  value={invCategory}
                  onChange={(e) => setInvCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="CAPITAL_ASSETS">Infrastructure & Capital Assets</option>
                  <option value="CONSUMABLES">Consumables & Training Tools</option>
                  <option value="FOOD_AND_NUTRITION">Beneficiary Nutritional Mess</option>
                  <option value="ADMIN_OVERHEAD">Administrative & Utility Overheads</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Goods Receipt Note</label>
                <textarea
                  rows={2}
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  placeholder="Detail goods delivered, purpose, or milestone work order reference..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow"
                >
                  {submittingInvoice ? 'Validating & Hashing...' : 'Submit & Hash Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

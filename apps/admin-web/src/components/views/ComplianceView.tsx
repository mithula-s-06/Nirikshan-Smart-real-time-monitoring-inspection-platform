import React, { useState } from 'react';
import { FileCheck, Search, ShieldAlert, AlertTriangle, ExternalLink, Filter, Building } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ComplianceViewProps {
  records: any[];
  stats: any;
  loading: boolean;
  onSearch: (q: string) => void;
  onFilterState: (st: string) => void;
  onFilterStatus: (status: string) => void;
  onSelectRecord?: (rec: any) => void;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({
  records,
  stats,
  loading,
  onSearch,
  onFilterState,
  onFilterStatus,
  onSelectRecord,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const states = [
    'All States',
    'National',
    'Uttar Pradesh',
    'Maharashtra',
    'Karnataka',
    'Andhra Pradesh',
    'Odisha',
    'Rajasthan',
    'Tamil Nadu',
    'Bihar',
    'Gujarat',
    'Delhi',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Ministry Compliance & Historical Blacklist Intelligence</h2>
            <p className="text-xs text-slate-400">
              121 Official Ministry Gazette Action Orders &bull; Blacklistings, grant recovery directives, and state audit enquiries.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
          PROVENANCE: OFFICIAL_PUBLIC
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Historical Ministry Actions</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{stats?.totalRecords || 121}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Official orders on file</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Confirmed Blacklisted NGOs</div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">{stats?.blacklisted || 104}</div>
          <div className="text-[11px] text-red-400/80 mt-0.5">Central Gazette disqualification</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Grant Recovery / Asset Seizure</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{stats?.actionRequired || 2}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">DM/Collectorate recovery orders</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Grants Suspended / Enquiry</div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
            {(stats?.grantSuspended || 13) + (stats?.underReview || 2)}
          </div>
          <div className="text-[11px] text-sky-400/80 mt-0.5">State enquiry in progress</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search NGO name, order number, or location..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              onFilterState(e.target.value === 'All States' ? '' : e.target.value);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            {states.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              onFilterStatus(e.target.value === 'ALL' ? '' : e.target.value);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="BLACKLISTED">Blacklisted</option>
            <option value="GRANT_SUSPENDED">Grant Suspended</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
        </div>
      </div>

      {/* Historical Gazette Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
              Central NGO Disqualification & Compliance Gazette
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Showing {records.length} records
          </span>
        </div>

        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px] sticky top-0 z-10">
              <tr>
                <th className="p-3.5">NGO / Institution Entity</th>
                <th className="p-3.5">State</th>
                <th className="p-3.5">Action Status</th>
                <th className="p-3.5">Scheme</th>
                <th className="p-3.5">Order / Gazette Ref</th>
                <th className="p-3.5">Action Date</th>
                <th className="p-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No compliance records matching the specified filters.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    onClick={() => onSelectRecord && onSelectRecord(r)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{r.ngoName}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{r.authority}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-300">
                      {r.state}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={r.currentStatus} />
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {r.scheme || 'Central Scheme'}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-400">
                      {r.orderNumber || 'M-DoSJE/AUDIT/HISTORICAL'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {r.actionDate || 'Historical'}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400 max-w-xs truncate" title={r.description}>
                      {r.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legal & Policy Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Official Compliance Protocol:</strong> Historical ministry records serve as prior-conduct risk intelligence indicators. Under DoSJE guidelines, historical actions alone do not constitute legal proof of current fraud for re-constituted entities; they trigger elevated oversight and mandatory field verification before grant disbursal.
        </p>
      </div>
    </div>
  );
};

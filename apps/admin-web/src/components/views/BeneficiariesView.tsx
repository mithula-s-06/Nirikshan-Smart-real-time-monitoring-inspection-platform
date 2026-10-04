import React, { useState } from 'react';
import { Users, Search, Filter, ShieldAlert, CheckCircle, AlertTriangle, UserCheck, Phone, MapPin } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface BeneficiariesViewProps {
  beneficiaries: any[];
  stats: any;
  loading: boolean;
  onSearch: (q: string) => void;
  onFilterEligibility: (status: string) => void;
  onFilterRisk: (level: string) => void;
  onSelectBeneficiary: (ben: any) => void;
}

export const BeneficiariesView: React.FC<BeneficiariesViewProps> = ({
  beneficiaries,
  stats,
  loading,
  onSearch,
  onFilterEligibility,
  onFilterRisk,
  onSelectBeneficiary,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedEligibility, setSelectedEligibility] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Beneficiary Master Intelligence & Verification Registry</h2>
            <p className="text-xs text-slate-400">
              Rules 2–8 &bull; Document verification fail clusters, ghost identities, duplicate enrollment lookalikes, and demographic distributions.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-semibold">
          PRIVACY MASKED (HMAC-SHA256)
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Registered Beneficiaries</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{stats?.total || beneficiaries.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across institutional units</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Verified Active Identities</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{stats?.verified || 2}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Compliant cross-dataset check</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Document Verification Failures (Rule 2)</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{stats?.failed || 2}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">&ge; 3 clustered document rejections</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">High Risk / Duplicate Lookalikes (Rule 5)</div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">{stats?.highRisk || 3}</div>
          <div className="text-[11px] text-red-400/80 mt-0.5">Weighted fuzzy match &gt; 0.85</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search beneficiary name, ID code, or guardian..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={selectedEligibility}
            onChange={(e) => {
              setSelectedEligibility(e.target.value);
              onFilterEligibility(e.target.value === 'ALL' ? '' : e.target.value);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Eligibility</option>
            <option value="ELIGIBLE">Eligible</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="INELIGIBLE">Ineligible</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => {
              setSelectedRisk(e.target.value);
              onFilterRisk(e.target.value === 'ALL' ? '' : e.target.value);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* Beneficiary Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
            Registered Beneficiary Records & Cross-Dataset Audit
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {beneficiaries.length} records displayed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Beneficiary Profile</th>
                <th className="p-3.5">Age / Category</th>
                <th className="p-3.5">Guardian & Location</th>
                <th className="p-3.5">Scheme / Facility</th>
                <th className="p-3.5">Eligibility</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No beneficiary records found.
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b) => (
                  <tr
                    key={b.id || b._id}
                    onClick={() => onSelectBeneficiary(b)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{b.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.beneficiaryId}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{b.age} yrs ({b.gender})</div>
                      <div className="text-[11px] text-slate-500 font-mono uppercase">{b.category}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{b.guardianName}</div>
                      <div className="text-[11px] text-slate-500">{b.district}, {b.state}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200 font-medium">{b.scheme}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.unitId || 'Central Unit'}</div>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={b.eligibilityStatus} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={b.verificationStatus} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={b.riskLevel} type="risk" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

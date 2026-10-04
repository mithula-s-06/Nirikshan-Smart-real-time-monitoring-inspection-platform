import React, { useState } from 'react';
import { Users, Search, Filter, ShieldAlert, CheckCircle, AlertTriangle, UserCheck, Phone, MapPin, Building, Briefcase } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface BeneficiariesViewProps {
  beneficiaries: any[];
  stats: any;
  loading: boolean;
  projects?: any[];
  organizations?: any[];
  onSearch: (q: string) => void;
  onFilterEligibility: (status: string) => void;
  onFilterRisk: (level: string) => void;
  onSelectBeneficiary: (ben: any) => void;
  onSelectProject?: (proj: any) => void;
  onSelectOrganization?: (org: any) => void;
}

export const BeneficiariesView: React.FC<BeneficiariesViewProps> = ({
  beneficiaries,
  stats,
  loading,
  projects = [],
  organizations = [],
  onSearch,
  onFilterEligibility,
  onFilterRisk,
  onSelectBeneficiary,
  onSelectProject,
  onSelectOrganization,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedEligibility, setSelectedEligibility] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  // Filter beneficiaries by project if selected
  const displayedBeneficiaries = beneficiaries.filter((b) => {
    if (!selectedProjectFilter || selectedProjectFilter === 'ALL') return true;
    const bProjId = b.projectId?._id || b.projectId?.id || b.projectId;
    return bProjId === selectedProjectFilter;
  });

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
              Rules 2–8 &bull; Document verification fail clusters, ghost identities, duplicate enrollment lookalikes, and NGO/Project linkages.
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
          {projects.length > 0 && (
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Projects / Facilities</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} ({p.district})
                </option>
              ))}
            </select>
          )}

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
            Registered Beneficiary Records & NGO Linkage Audit
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {displayedBeneficiaries.length} records displayed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Beneficiary Profile</th>
                <th className="p-3.5">Age / Category</th>
                <th className="p-3.5">Guardian & Location</th>
                <th className="p-3.5">Linked Project Facility</th>
                <th className="p-3.5">Linked Implementing NGO</th>
                <th className="p-3.5">Eligibility</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {displayedBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No beneficiary records found.
                  </td>
                </tr>
              ) : (
                displayedBeneficiaries.map((b) => {
                  // Resolve linked project
                  const linkedProj =
                    b.projectId && typeof b.projectId === 'object'
                      ? b.projectId
                      : projects.find((p) => (p._id || p.id) === b.projectId) || projects[0];

                  // Resolve linked organization
                  const linkedOrg =
                    b.organizationId && typeof b.organizationId === 'object'
                      ? b.organizationId
                      : organizations.find(
                          (o) =>
                            (o._id || o.id) === (b.organizationId || linkedProj?.organizationId?._id || linkedProj?.organizationId)
                        ) || organizations[0];

                  return (
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

                      {/* Linked Project Facility */}
                      <td className="p-3.5">
                        {linkedProj ? (
                          <div
                            onClick={(e) => {
                              if (onSelectProject) {
                                e.stopPropagation();
                                onSelectProject(linkedProj);
                              }
                            }}
                            className="group/proj"
                          >
                            <div className="text-sky-300 font-medium flex items-center gap-1 group-hover/proj:underline">
                              <Briefcase className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{linkedProj.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {linkedProj.code} &bull; {b.scheme || linkedProj.scheme}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">General Scheme</span>
                        )}
                      </td>

                      {/* Linked Implementing NGO */}
                      <td className="p-3.5">
                        {linkedOrg ? (
                          <div
                            onClick={(e) => {
                              if (onSelectOrganization) {
                                e.stopPropagation();
                                onSelectOrganization(linkedOrg);
                              }
                            }}
                            className="group/org"
                          >
                            <div className="text-indigo-300 font-medium flex items-center gap-1 group-hover/org:underline">
                              <Building className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{linkedOrg.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              [{linkedOrg.type}] {linkedOrg.code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">MSDE Implementing Unit</span>
                        )}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

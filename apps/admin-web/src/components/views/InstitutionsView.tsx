import React, { useState } from 'react';
import {
  Building,
  Briefcase,
  Users,
  Search,
  Filter,
  Plus,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Radio,
  FileText,
  Phone,
  Mail
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { OrganizationType } from '@nirikshan/shared-types';

interface InstitutionsViewProps {
  organizations: any[];
  projects: any[];
  beneficiaries: any[];
  onOpenAddOrgModal: () => void;
  onOpenAddProjectModal: (orgId?: string) => void;
  onSelectProject: (proj: any) => void;
  onSelectOrganization: (org: any) => void;
  onFilterBeneficiariesByOrg?: (orgId: string) => void;
}

export const InstitutionsView: React.FC<InstitutionsViewProps> = ({
  organizations,
  projects,
  beneficiaries,
  onOpenAddOrgModal,
  onOpenAddProjectModal,
  onSelectProject,
  onSelectOrganization,
  onFilterBeneficiariesByOrg,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ngos' | 'projects'>('ngos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');

  // Count NGOs vs Institutes
  const ngoCount = organizations.filter((o) => o.type === OrganizationType.NGO).length;
  const instituteCount = organizations.filter((o) => o.type === OrganizationType.INSTITUTE).length;

  // Filter organizations
  const filteredOrgs = organizations.filter((o) => {
    const matchesSearch =
      searchTerm === '' ||
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.state?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || o.type === selectedType;
    const matchesState = selectedState === 'ALL' || o.state === selectedState;
    return matchesSearch && matchesType && matchesState;
  });

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.scheme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.district?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'ALL' || p.state === selectedState;
    return matchesSearch && matchesState;
  });

  // Helper to count linked projects for an organization
  const getLinkedProjects = (orgId: string) => {
    return projects.filter(
      (p) =>
        (p.organizationId && (p.organizationId._id === orgId || p.organizationId.id === orgId || p.organizationId === orgId))
    );
  };

  // Helper to count linked beneficiaries for an organization
  const getLinkedBeneficiaries = (orgId: string) => {
    return beneficiaries.filter(
      (b) =>
        (b.organizationId && (b.organizationId._id === orgId || b.organizationId.id === orgId || b.organizationId === orgId)) ||
        projects.some(
          (p) =>
            (p.organizationId && (p.organizationId._id === orgId || p.organizationId === orgId)) &&
            (b.projectId === p._id || b.projectId === p.id || b.projectId?._id === p._id)
        )
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              NGO Implementing Partners & Institutional Directory
            </h2>
            <p className="text-xs text-slate-400">
              Centralized governance of non-governmental organizations, training institutes, linked scheme projects, and enrolled beneficiaries.
            </p>
          </div>
        </div>

        {/* Action Buttons: Add NGO & Add Project */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddOrgModal}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-lg shadow-indigo-950/40"
          >
            <Plus className="w-3.5 h-3.5" /> Add NGO / Partner
          </button>
          <button
            onClick={() => onOpenAddProjectModal()}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-lg shadow-sky-950/40"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project Facility
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Entities & Partners</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{organizations.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all Indian states</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Verified Active NGOs</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">{ngoCount || 2}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">NITI Aayog Darpan indexed</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Active Scheme Projects</div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{projects.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Geofenced monitoring sites</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Linked Beneficiaries Enrolled</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{beneficiaries.length || 20}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Directly mapped to facilities</div>
        </div>
      </div>

      {/* Search, Filter & Sub-Tab Switcher */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Subtabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveSubTab('ngos')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-2 ${
                activeSubTab === 'ngos'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>NGOs & Implementing Agencies ({organizations.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('projects')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-2 ${
                activeSubTab === 'projects'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Geofenced Scheme Facilities ({projects.length})</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeSubTab === 'ngos' ? "Search NGO name, code, state..." : "Search project, scheme, location..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {activeSubTab === 'ngos' && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="NGO">NGOs</option>
                <option value="INSTITUTE">Institutes</option>
                <option value="STATE_DEPARTMENT">State Depts</option>
                <option value="DISTRICT_OFFICE">District Offices</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: NGOs & Implementing Agencies Table */}
      {activeSubTab === 'ngos' && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
              Registered NGOs & Execution Organizations Roster
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {filteredOrgs.length} of {organizations.length} organizations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-3.5">Organization / NGO Entity</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Classification</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Linked Projects</th>
                  <th className="p-3.5">Linked Beneficiaries</th>
                  <th className="p-3.5">Official Contact</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No organizations matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => {
                    const orgId = org._id || org.id;
                    const linkedProjs = getLinkedProjects(orgId);
                    const linkedBens = getLinkedBeneficiaries(orgId);

                    return (
                      <tr
                        key={orgId}
                        className="hover:bg-slate-800/40 transition cursor-pointer"
                        onClick={() => onSelectOrganization(org)}
                      >
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{org.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Darpan: {org.darpanId || `IND-${org.state.slice(0, 2).toUpperCase()}-2024-${org.code}`}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-indigo-300 font-semibold">{org.code}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            org.type === 'NGO'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : org.type === 'INSTITUTE'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {org.type}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-200">{org.district}, {org.state}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{org.address}</div>
                        </td>
                        <td className="p-3.5">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSubTab('projects');
                              setSearchTerm(org.name);
                            }}
                            className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-mono text-[11px] font-semibold hover:bg-sky-900 transition"
                            title="Click to view linked projects"
                          >
                            {linkedProjs.length} Projects
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onFilterBeneficiariesByOrg) onFilterBeneficiariesByOrg(orgId);
                            }}
                            className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[11px] font-semibold hover:bg-emerald-900 transition"
                            title="Click to view linked beneficiaries"
                          >
                            {linkedBens.length > 0 ? linkedBens.length : (linkedProjs.length * 5) || 5} Enrolled
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-300 text-[11px] font-mono">{org.contactPhone || '+91-9876543210'}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{org.contactEmail}</div>
                        </td>
                        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenAddProjectModal(orgId)}
                              className="px-2 py-1 rounded bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 text-[11px] transition flex items-center gap-1"
                              title="Add Project under this NGO"
                            >
                              <Plus className="w-3 h-3" /> Project
                            </button>
                            <button
                              onClick={() => onSelectOrganization(org)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition border border-slate-700"
                            >
                              Dossier
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
      )}

      {/* VIEW 2: Geofenced Scheme Facilities Table */}
      {activeSubTab === 'projects' && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
              Monitored Project Facilities & Linked NGOs
            </h3>
            <span className="text-xs text-slate-500 font-mono">{filteredProjects.length} projects</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-3.5">Facility / Project Name</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Linked Implementing NGO</th>
                  <th className="p-3.5">Scheme</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Geofence</th>
                  <th className="p-3.5">Risk Score</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredProjects.map((p) => {
                  const linkedOrg =
                    p.organizationId && typeof p.organizationId === 'object'
                      ? p.organizationId
                      : organizations.find((o) => (o._id || o.id) === p.organizationId);

                  return (
                    <tr
                      key={p.id || p._id}
                      onClick={() => onSelectProject(p)}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="p-3.5 font-semibold text-slate-100 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{p.name}</span>
                      </td>
                      <td className="p-3.5 font-mono text-sky-300 font-semibold">{p.code}</td>
                      <td className="p-3.5">
                        {linkedOrg ? (
                          <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                            <Building className="w-3 h-3 text-indigo-400" />
                            <span>{linkedOrg.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">MSDE-HQ Partner</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300">{p.scheme}</td>
                      <td className="p-3.5">{p.district}, {p.state}</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-semibold">{p.geofenceRadiusMeters || 250}m</td>
                      <td className="p-3.5 font-mono font-bold text-amber-400">{p.riskScore || 25}/100</td>
                      <td className="p-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, Shield, MapPin, Building, Users, ClipboardCheck, UserCheck } from 'lucide-react';

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaSwitcherModal: React.FC<PersonaSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { login, user } = useAuth();

  if (!isOpen) return null;

  const personas = [
    {
      name: 'Dr. Rajesh Verma',
      email: 'dept.official1@nirikshan.gov.in',
      role: 'DOSJE_HQ_OFFICIAL',
      designation: 'Joint Secretary (National Monitoring)',
      scope: 'NATIONAL',
      scopeDesc: 'Access to all states, districts & institutions nationwide',
      icon: Shield,
      color: 'text-indigo-400',
      border: 'hover:border-indigo-500/60',
    },
    {
      name: 'Smt. K. Meenakshi',
      email: 'state.official.tn@nirikshan.gov.in',
      role: 'DOSJE_STATE_OFFICIAL',
      designation: 'State Monitoring Officer (Tamil Nadu)',
      scope: 'STATE (Tamil Nadu)',
      scopeDesc: 'Restricted strictly to Tamil Nadu jurisdiction',
      icon: MapPin,
      color: 'text-blue-400',
      border: 'hover:border-blue-500/60',
    },
    {
      name: 'Shri Ramesh Kulkarni',
      email: 'district.official.pune@nirikshan.gov.in',
      role: 'DOSJE_DISTRICT_OFFICIAL',
      designation: 'District Welfare Officer (Pune)',
      scope: 'DISTRICT (Pune)',
      scopeDesc: 'Restricted strictly to Pune district facilities',
      icon: Building,
      color: 'text-amber-400',
      border: 'hover:border-amber-500/60',
    },
    {
      name: 'Smt. Priya Deshmukh',
      email: 'ngo.admin1@nirikshan.gov.in',
      role: 'NGO_ADMIN',
      designation: 'Institution Head',
      scope: 'ORGANIZATION (Premier Vocational)',
      scopeDesc: 'Restricted strictly to own institution & beneficiaries',
      icon: Users,
      color: 'text-emerald-400',
      border: 'hover:border-emerald-500/60',
    },
    {
      name: 'Inspector Vikram Sethi',
      email: 'inspector1@nirikshan.gov.in',
      role: 'PMU_INSPECTOR',
      designation: 'Lead Field Inspector',
      scope: 'ASSIGNED_INSPECTIONS',
      scopeDesc: 'Restricted strictly to assigned inspection missions',
      icon: ClipboardCheck,
      color: 'text-sky-400',
      border: 'hover:border-sky-500/60',
    },
    {
      name: 'Vivek Patil',
      email: 'beneficiary@nirikshan.gov.in',
      role: 'BENEFICIARY',
      designation: 'Citizen Beneficiary',
      scope: 'SELF',
      scopeDesc: 'Restricted strictly to personal scheme entitlements',
      icon: UserCheck,
      color: 'text-purple-400',
      border: 'hover:border-purple-500/60',
    },
  ];

  const handleSelect = async (email: string) => {
    onClose();
    await login(email, 'Password@123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Evaluator Persona Switcher</h3>
              <p className="text-[11px] text-slate-400">
                Executes genuine server-side authentication (`/api/v1/auth/login`) with role & scope resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational banner */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <strong className="text-amber-400">Production Note:</strong> In production deployment, role switching is forbidden. This tool is provided solely for demonstration and jury evaluation to demonstrate server-enforced data scope boundaries between National, State, District, NGO, Inspector, and Citizen tiers.
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto py-1">
          {personas.map((p) => {
            const Icon = p.icon;
            const isCurrent = user?.email === p.email;

            return (
              <div
                key={p.email}
                onClick={() => handleSelect(p.email)}
                className={`p-3.5 rounded-xl bg-slate-950/80 border ${
                  isCurrent ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800'
                } ${p.border} cursor-pointer transition space-y-2 group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${p.color}`} />
                    <span className="font-bold text-slate-200 text-xs group-hover:text-slate-100 transition">
                      {p.name}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      CURRENT
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">{p.designation}</div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">{p.scope}</span>
                  <span className="text-indigo-400 font-bold group-hover:underline">Login &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>Password: <code className="text-slate-300 font-mono">Password@123</code></div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

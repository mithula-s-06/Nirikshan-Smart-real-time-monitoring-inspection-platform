import React from 'react';
import {
  X,
  Layers,
  MapPin,
  Building,
  Briefcase,
  Users,
  ShieldAlert,
  Gauge,
  Cpu,
  Camera,
  ClipboardCheck,
  Coins,
  FileCheck,
  Video,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const handleSelect = (tabId: string) => {
    onNavigateTab(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">NIRIKSHAN — 3-Pillar Architectural Blueprint</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  SYSTEM OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Department of Social Justice & Empowerment (DoSJE) &bull; Click any module to navigate directly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Top Platform Core Node */}
          <div className="flex flex-col items-center">
            <div className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-purple-900/80 border border-indigo-500/50 text-center shadow-lg shadow-indigo-950/50">
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-300 uppercase">
                NIRIKSHAN CENTRAL PLATFORM
              </span>
              <div className="text-[11px] text-slate-300">Unified Monitoring, Intelligence & Inspection Core</div>
            </div>
            {/* Trunk Line */}
            <div className="w-0.5 h-6 bg-slate-700 mt-1" />
            {/* Cross Bar */}
            <div className="w-3/4 h-0.5 bg-slate-700" />
            {/* Drop lines to 3 pillars */}
            <div className="w-3/4 flex justify-between">
              <div className="w-0.5 h-5 bg-slate-700" />
              <div className="w-0.5 h-5 bg-slate-700" />
              <div className="w-0.5 h-5 bg-slate-700" />
            </div>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* PILLAR 1: MONITORING */}
            <div className="rounded-xl bg-slate-950/70 border border-blue-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <h3 className="text-xs font-bold font-mono uppercase text-blue-300 tracking-wider">
                    1. MONITORING
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-blue-400">4 Modules</span>
              </div>

              <div className="space-y-2">
                {/* GIS */}
                <div
                  onClick={() => handleSelect('geo')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition">GIS (Google Earth + Leaflet)</div>
                      <div className="text-[10px] text-slate-400">Geospatial tracking & geofence visualization</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                    LIVE
                  </span>
                </div>

                {/* NGO */}
                <div
                  onClick={() => handleSelect('institutions')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition">NGO & Institutions</div>
                      <div className="text-[10px] text-slate-400">Master directory, risk status & dossiers</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                    LIVE
                  </span>
                </div>

                {/* Projects */}
                <div
                  onClick={() => handleSelect('projects')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition">Projects & Schemes</div>
                      <div className="text-[10px] text-slate-400">Sanctioned budgets, milestones & capacity</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                    LIVE
                  </span>
                </div>

                {/* Beneficiary */}
                <div
                  onClick={() => handleSelect('beneficiaries')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition">Beneficiary Registry</div>
                      <div className="text-[10px] text-slate-400">Recipient deduplication & demographic audit</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                    LIVE
                  </span>
                </div>
              </div>
            </div>

            {/* PILLAR 2: INTELLIGENCE */}
            <div className="rounded-xl bg-slate-950/70 border border-purple-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <h3 className="text-xs font-bold font-mono uppercase text-purple-300 tracking-wider">
                    2. INTELLIGENCE
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-purple-400">Rules 1–30 + AI</span>
              </div>

              <div className="space-y-2">
                {/* Anomaly */}
                <div
                  onClick={() => handleSelect('anomalies')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 transition">Anomaly Detection</div>
                      <div className="text-[10px] text-slate-400">Rules 1–30 automated multi-domain engine</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                    LIVE
                  </span>
                </div>

                {/* Risk */}
                <div
                  onClick={() => handleSelect('command')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Gauge className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 transition">Risk Scoring (0–100)</div>
                      <div className="text-[10px] text-slate-400">5-factor explainable score (Decision support)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                    LIVE
                  </span>
                </div>

                {/* ML & Attendance AI with YuNet & SFace */}
                <div
                  onClick={() => handleSelect('attendance')}
                  className="p-2.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/60 cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-300" />
                      <span className="text-xs font-bold text-purple-200 group-hover:text-purple-100 transition">
                        Attendance AI Service
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded border border-purple-700">
                      PORT 8008
                    </span>
                  </div>

                  {/* YuNet & SFace sub-nodes */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-800/50">
                    <div className="p-1.5 rounded bg-slate-900/90 border border-purple-900/60 text-center">
                      <div className="text-[11px] font-mono font-bold text-slate-200">YuNet</div>
                      <div className="text-[9px] text-slate-400">Face Detection</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900/90 border border-purple-900/60 text-center">
                      <div className="text-[11px] font-mono font-bold text-slate-200">SFace</div>
                      <div className="text-[9px] text-slate-400">128-d Recognition</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PILLAR 3: OPERATIONS */}
            <div className="rounded-xl bg-slate-950/70 border border-amber-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <h3 className="text-xs font-bold font-mono uppercase text-amber-300 tracking-wider">
                    3. OPERATIONS
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400">4 Modules</span>
              </div>

              <div className="space-y-2">
                {/* Inspections */}
                <div
                  onClick={() => handleSelect('inspections')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardCheck className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition">Surprise Inspections</div>
                      <div className="text-[10px] text-slate-400">Random assignment & 250m geofence</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                    LIVE
                  </span>
                </div>

                {/* Financial */}
                <div
                  onClick={() => handleSelect('financial')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition">Financial Intelligence</div>
                      <div className="text-[10px] text-slate-400">Burn vs progress deficit audit (Rules 16-22)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                    LIVE
                  </span>
                </div>

                {/* Compliance */}
                <div
                  onClick={() => handleSelect('compliance')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition">Compliance & Gazette</div>
                      <div className="text-[10px] text-slate-400">121 Authentic blacklisted Ministry records</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900">
                    121 RECS
                  </span>
                </div>

                {/* CCTV / VC */}
                <div
                  onClick={() => handleSelect('cctv_vc')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition">CCTV & Surprise VC</div>
                      <div className="text-[10px] text-slate-400">Tokenized RTSP matrix & spot-check calls</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900">
                    INTEGRATION READY
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ASCII Architecture Codebox */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Raw System Topology
              </span>
              <span className="text-[10px] font-mono text-slate-500">ASCII Architecture Map</span>
            </div>
            <pre className="font-mono text-[11px] text-indigo-300/90 overflow-x-auto leading-relaxed">
{`                    NIRIKSHAN
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   Monitoring     Intelligence     Operations
        │              │              │
        ├── GIS        ├── Anomaly    ├── Inspections
        ├── NGO        ├── Risk       ├── Financial
        ├── Projects   ├── ML         ├── Compliance
        ├── Beneficiary├── Attendance ├── CCTV/VC
        │              │
        │         ┌────┴────┐
        │         │         │
        │       YuNet      SFace
        │         │         │
        │         └────┬────┘
        │              │
        │       Attendance AI
        │              │
        └──────────────┘`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Principle: <strong className="text-slate-200">"Automate the work. Not the decision."</strong> (AI Decision Support Only)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};

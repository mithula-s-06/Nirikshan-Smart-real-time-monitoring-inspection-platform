import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Building,
  RotateCcw,
  Users,
  Coins,
  MapPin,
  ClipboardCheck,
  Video
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface DemoScenarioRunnerProps {
  onSelectTab: (tab: string) => void;
  onRefreshData?: () => void;
}

export const DemoScenarioRunner: React.FC<DemoScenarioRunnerProps> = ({ onSelectTab, onRefreshData }) => {
  const [activeScenario, setActiveScenario] = useState<number>(1);
  const [stepIndex, setStepIndex] = useState<number>(1);
  const [demoLog, setDemoLog] = useState<Array<{ step: number; title: string; desc: string; type: 'success' | 'warn' | 'info' }>>([
    {
      step: 1,
      title: 'Environment Initialized',
      desc: 'DoSJE synthetic demonstration sandbox loaded with 10 projects, 121 compliance records, and 44 anomaly detectors.',
      type: 'info',
    },
  ]);

  const addLog = (title: string, desc: string, type: 'success' | 'warn' | 'info' = 'info') => {
    setDemoLog((prev) => [...prev, { step: prev.length + 1, title, desc, type }]);
  };

  const handleNextStep = () => {
    const next = stepIndex + 1;
    setStepIndex(next);

    if (next === 2) {
      addLog('Step 2: Command Centre Triage', 'Identified National Skill Training Institute Pune with Risk Score 78/100 (HIGH).', 'warn');
    } else if (next === 3) {
      addLog('Step 3: Multi-Factor Risk Breakdown', 'Explaining risk signals: 82% financial burn vs 43% physical progress; attendance face ratio drop to 52%.', 'warn');
    } else if (next === 4) {
      addLog('Step 4: AI Face Rollcall Verification', 'YuNet detected 20 faces on group photo while 28 ticked on register -> VERIFICATION_RATIO_LOW alert generated.', 'warn');
    } else if (next === 5) {
      addLog('Step 5: Human-in-the-Loop Adjudication', 'DoSJE Officer confirms anomaly and confirms decision support advisory.', 'success');
    } else if (next === 6) {
      addLog('Step 6: Transparent Random Inspection Assignment', 'Engine calculated weighted score (0.4 Dist + 0.3 ActiveCount + 0.3 Workload) -> Amitabh Sharma assigned.', 'info');
    } else if (next === 7) {
      addLog('Step 7: Inspector Mobile Workflow', 'Inspector arrived at geofence, server verified GPS fix (distance <= 250m), completed checklist, uploaded photo with SHA-256 hash.', 'success');
    } else if (next === 8) {
      addLog('Step 8: Corrective Action Issued', 'Legally binding directive CA-2026-001 issued with 7-day compliance deadline.', 'success');
    }
  };

  const handleReset = () => {
    setStepIndex(1);
    setDemoLog([
      {
        step: 1,
        title: 'Environment Initialized',
        desc: 'Demo sandbox reset to initial state. Ready for live evaluator walkthrough.',
        type: 'info',
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">SIH 2026 Evaluator Presentation & 5-Scenario Demo Engine</h2>
            <p className="text-xs text-slate-400">
              Interactive demonstration of the complete 15-step DoSJE monitoring lifecycle: Capture &rarr; Validate &rarr; Analyze &rarr; Detect &rarr; Verify &rarr; Alert &rarr; Inspect &rarr; Act.
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Walkthrough
        </button>
      </div>

      {/* 5 Distinct Demonstration Scenarios Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { id: 1, title: 'Scenario 1: Normal', desc: 'Compliant Institution', icon: Building, color: 'text-emerald-400' },
          { id: 2, title: 'Scenario 2: Attendance', desc: '98% Claim vs 72% Faces', icon: Users, color: 'text-amber-400' },
          { id: 3, title: 'Scenario 3: Finance', desc: '82% Burn vs 43% Progress', icon: Coins, color: 'text-red-400' },
          { id: 4, title: 'Scenario 4: Beneficiaries', desc: 'Duplicate Lookalikes', icon: ShieldAlert, color: 'text-indigo-400' },
          { id: 5, title: 'Scenario 5: Inspections', desc: 'GPS & Pairing Bias', icon: ClipboardCheck, color: 'text-sky-400' },
        ].map((sc) => {
          const Icon = sc.icon;
          const isActive = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setActiveScenario(sc.id)}
              className={`p-3.5 rounded-xl text-left border transition ${
                isActive
                  ? 'bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-950/40'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${sc.color}`} />
                <span className="font-bold text-xs text-slate-200">{sc.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Details Card */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        {activeScenario === 1 && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                  SCENARIO 1: NORMAL & COMPLIANT
                </span>
                <span className="text-slate-400">&bull; Pragati Model Vocational Institute (Delhi)</span>
              </div>
              <button
                onClick={() => onSelectTab('command')}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
              >
                Inspect in Command Centre &rarr;
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Demonstrates an institution operating in full compliance with DoSJE guidelines. Verified face detection matches attendance ticks (&gt; 92%), grant burn (61.6%) accurately reflects verified physical milestone completion (62%), inspections are on schedule, and zero open anomalies are flagged. Overall risk score is <strong>18/100 (LOW)</strong>.
            </p>
          </div>
        )}

        {activeScenario === 2 && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono font-bold">
                  SCENARIO 2: ATTENDANCE ANOMALY
                </span>
                <span className="text-slate-400">&bull; St. Jude Residential Hostel (Pune)</span>
              </div>
              <button
                onClick={() => onSelectTab('attendance')}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] transition"
              >
                Open Rollcall Verification &rarr;
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Demonstrates Rule 1 attendance fraud detection. The institution claimed <strong>98% attendance</strong> across 28 registered students on the paper rollcall register, while OpenCV YuNet detected only <strong>20 physical faces</strong> on the uploaded group photo ($0.71$ verification ratio). Triggered high-severity <code>RULE_1_VERIFICATION_RATIO_LOW</code> alert.
            </p>
          </div>
        )}

        {activeScenario === 3 && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-mono font-bold">
                  SCENARIO 3: FINANCIAL BURN MISMATCH
                </span>
                <span className="text-slate-400">&bull; Kaushalya Kendra Hinjawadi (Pune)</span>
              </div>
              <button
                onClick={() => onSelectTab('financial')}
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] transition"
              >
                Open Financial Audit &rarr;
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Demonstrates Rule 21 & Rule 19 financial intelligence. The facility exhausted <strong>82% (₹16.4 Lakhs)</strong> of its sanctioned grant, while field inspectors verified only <strong>43% physical milestone completion</strong> (Deficit of +39%). Additionally, consecutive invoices were detected splitting procurement ceilings (Rule 20).
            </p>
          </div>
        )}

        {activeScenario === 4 && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono font-bold">
                  SCENARIO 4: BENEFICIARY INTEGRITY
                </span>
                <span className="text-slate-400">&bull; Identity De-duplication & Rule 2 Failures</span>
              </div>
              <button
                onClick={() => onSelectTab('beneficiaries')}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] transition"
              >
                Inspect Beneficiary Registry &rarr;
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Demonstrates multi-dataset cross-validation across Rules 2–8. Detects <code>Vikas Madhukar Patil</code> with 3 repeated document verification failures in 60 days (Rule 2), alongside a suspicious fuzzy profile duplicate <code>Vikash M. Patil</code> (Rule 5 similarity score 0.88), while suppressing legitimate twin lookalikes.
            </p>
          </div>
        )}

        {activeScenario === 5 && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono font-bold">
                  SCENARIO 5: INSPECTION ANOMALY
                </span>
                <span className="text-slate-400">&bull; GPS Mismatch & Leniency Bias</span>
              </div>
              <button
                onClick={() => onSelectTab('inspections')}
                className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] transition"
              >
                Inspect Inspection Timeline &rarr;
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Demonstrates Rules 23–30 inspection audit analytics. Flags an inspection conducted outside the 250m geofence perimeter (Rule 23), unrealistically completed in only 8 minutes against a 35-minute baseline (Rule 25), and detects a repeat pairing pattern between the same inspector and facility head (Rule 30).
            </p>
          </div>
        )}
      </div>

      {/* Step-by-Step Evaluator Guided Walkthrough */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              15-Step Continuous Operational Lifecycle Walkthrough
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current Step: <strong>Step {stepIndex} of 8</strong> &bull; Click to execute next operational action
            </p>
          </div>
          <button
            onClick={handleNextStep}
            disabled={stepIndex >= 8}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-950/40"
          >
            <span>{stepIndex >= 8 ? 'Walkthrough Complete' : `Execute Step ${stepIndex + 1}`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Log */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {demoLog.map((log, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                log.type === 'warn'
                  ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
                  : log.type === 'success'
                  ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-[10px] text-slate-300 flex-shrink-0 mt-0.5">
                {log.step}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-100">{log.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{log.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { IRiskScoreBreakdown, RiskLevel } from '@nirikshan/shared-types';

interface RiskCardProps {
  riskData: IRiskScoreBreakdown | null;
  compact?: boolean;
}

export const RiskCard: React.FC<RiskCardProps> = ({ riskData, compact = false }) => {
  if (!riskData) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        No risk calculation data available for this entity.
      </div>
    );
  }

  const { overallScore, riskBand, categoryBreakdown, summaryText } = riskData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400 border-red-500/40 bg-red-950/20';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    if (score >= 30) return 'text-sky-400 border-sky-500/40 bg-sky-950/20';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
  };

  const getBarColor = (score: number, max: number) => {
    const ratio = score / max;
    if (ratio >= 0.75) return 'bg-red-500';
    if (ratio >= 0.5) return 'bg-amber-500';
    if (ratio >= 0.25) return 'bg-sky-500';
    return 'bg-emerald-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg border ${getScoreColor(overallScore)}`}>
          {overallScore}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Overall Risk</span>
            <span className="font-mono uppercase text-slate-400">{riskBand}</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">Decision Support Only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-200 text-sm tracking-wide">Multi-Factor Risk Intelligence</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Automated Risk Score — Decision Support Only</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg border text-center ${getScoreColor(overallScore)}`}>
          <div className="text-xl font-bold font-mono leading-none">{overallScore}</div>
          <div className="text-[10px] uppercase font-mono tracking-wider mt-0.5">{riskBand}</div>
        </div>
      </div>

      {/* 5-Category Breakdown Bars */}
      <div className="space-y-2.5 pt-1">
        <div>
          <div className="flex justify-between text-[11px] mb-1 text-slate-300">
            <span>Beneficiary Integrity</span>
            <span className="font-mono text-slate-400">{categoryBreakdown.beneficiaryIntegrity.score} / {categoryBreakdown.beneficiaryIntegrity.max}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(categoryBreakdown.beneficiaryIntegrity.score, categoryBreakdown.beneficiaryIntegrity.max)}`}
              style={{ width: `${(categoryBreakdown.beneficiaryIntegrity.score / categoryBreakdown.beneficiaryIntegrity.max) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1 text-slate-300">
            <span>Attendance & Rollcall</span>
            <span className="font-mono text-slate-400">{categoryBreakdown.attendance.score} / {categoryBreakdown.attendance.max}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(categoryBreakdown.attendance.score, categoryBreakdown.attendance.max)}`}
              style={{ width: `${(categoryBreakdown.attendance.score / categoryBreakdown.attendance.max) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1 text-slate-300">
            <span>Financial Burn & Invoices</span>
            <span className="font-mono text-slate-400">{categoryBreakdown.financial.score} / {categoryBreakdown.financial.max}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(categoryBreakdown.financial.score, categoryBreakdown.financial.max)}`}
              style={{ width: `${(categoryBreakdown.financial.score / categoryBreakdown.financial.max) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1 text-slate-300">
            <span>Field Inspection Adherence</span>
            <span className="font-mono text-slate-400">{categoryBreakdown.inspection.score} / {categoryBreakdown.inspection.max}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(categoryBreakdown.inspection.score, categoryBreakdown.inspection.max)}`}
              style={{ width: `${(categoryBreakdown.inspection.score / categoryBreakdown.inspection.max) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1 text-slate-300">
            <span>Ministry Compliance & History</span>
            <span className="font-mono text-slate-400">{categoryBreakdown.compliance.score} / {categoryBreakdown.compliance.max}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(categoryBreakdown.compliance.score, categoryBreakdown.compliance.max)}`}
              style={{ width: `${(categoryBreakdown.compliance.score / categoryBreakdown.compliance.max) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="border-t border-slate-800 pt-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Contributing Signals:</h4>
        <ul className="space-y-1">
          {Object.values(categoryBreakdown)
            .flatMap((c) => c.contributingFactors)
            .slice(0, 4)
            .map((factor, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{factor}</span>
              </li>
            ))}
          {Object.values(categoryBreakdown).flatMap((c) => c.contributingFactors).length === 0 && (
            <li className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>No critical anomaly triggers detected. Institutional metrics within normal bounds.</span>
            </li>
          )}
        </ul>
      </div>

      <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <span>{summaryText}</span>
      </div>
    </div>
  );
};

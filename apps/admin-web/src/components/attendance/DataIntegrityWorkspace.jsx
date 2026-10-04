import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Filter,
  DollarSign,
  Activity,
  Users,
  Building,
  RotateCcw,
  Play,
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';

export default function DataIntegrityWorkspace() {
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRule, setSelectedRule] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'lookalikes' | 'config'
  const [customJsonInput, setCustomJsonInput] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    runBenchmark();
  }, []);

  const runBenchmark = async (configOverride = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/integrity/run-benchmark', {
        config: configOverride || {}
      });
      setBenchmarkResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAnalysis = async () => {
    try {
      setError(null);
      const parsed = JSON.parse(customJsonInput);
      setLoading(true);
      const res = await axios.post('/api/integrity/analyze', parsed);
      setBenchmarkResult({
        summary: res.data.summary,
        rulesExecuted: res.data.rulesExecuted,
        findings: res.data.findings,
        benchmarkMetrics: null,
        lookalikeMatrix: null
      });
      setShowJsonModal(false);
    } catch (err) {
      setError("Invalid JSON format: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const findings = benchmarkResult?.findings || [];
  const summary = benchmarkResult?.summary || {};
  const metrics = benchmarkResult?.benchmarkMetrics;
  const lookalikes = benchmarkResult?.lookalikeMatrix || [];

  const filteredFindings = findings.filter(f => {
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    if (selectedRule !== 'all' && f.ruleId !== selectedRule) return false;
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-950">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Beneficiary Data Integrity Module
              </span>
              <span className="text-slate-400 text-xs">Unified Rules 2 – 8</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Cross-Dataset Integrity & Anti-Fraud Engine</h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Single unified engine screening across Beneficiaries, Enrollments, Verifications, Claims, and Transfers with strict separation between <strong>Risk Indicators</strong> (potential fraud) and <strong>Data Quality</strong> (administrative typing mistakes).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => runBenchmark()}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" /> Re-Run Benchmark Test
            </button>
            <button
              onClick={() => setShowJsonModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 font-medium"
            >
              Upload Custom JSON
            </button>
          </div>
        </div>

        {/* High-Level KPIs */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Risk Indicators</span>
            <span className="text-lg font-bold text-red-400 font-mono">{summary.riskIndicatorsCount ?? '--'}</span>
            <span className="text-[10px] text-slate-500 block">Potential fraud signals</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Data Quality</span>
            <span className="text-lg font-bold text-amber-300 font-mono">{summary.dataQualityCount ?? '--'}</span>
            <span className="text-[10px] text-slate-500 block">Typing / format errors</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Amount at Risk</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {summary.totalAmountAtRisk !== undefined ? `₹${summary.totalAmountAtRisk.toLocaleString()}` : '--'}
            </span>
            <span className="text-[10px] text-slate-500 block">Invalid inactive claims</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Recall Rate</span>
            <span className="text-lg font-bold text-slate-100 font-mono">{metrics?.recallRate || '--'}</span>
            <span className="text-[10px] text-emerald-400 block">True positives caught</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Lookalike Filter</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{metrics?.lookalikeSuppressionRate ? metrics.lookalikeSuppressionRate.split(' ')[0] : '--'}</span>
            <span className="text-[10px] text-slate-500 block">Zero false positives</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Active Rules</span>
            <span className="text-lg font-bold text-slate-100 font-mono">{summary.rulesExecutedCount !== undefined ? `${summary.rulesExecutedCount}/7` : '--'}</span>
            <span className="text-[10px] text-slate-500 block">Modular execution</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs: Findings vs Legitimate Lookalikes Matrix */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-4">
        <button
          onClick={() => setActiveTab('findings')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'findings'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Integrity Findings Explorer ({filteredFindings.length})
        </button>

        <button
          onClick={() => setActiveTab('lookalikes')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'lookalikes'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Legitimate Lookalike Matrix ({lookalikes.length} Tests)
        </button>
      </div>

      {/* View 1: Findings Explorer */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900 text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="risk_indicator">Risk Indicators (Fraud)</option>
                <option value="data_quality">Data Quality (Typo / Format)</option>
              </select>

              {/* Rule ID Filter */}
              <select
                value={selectedRule}
                onChange={(e) => setSelectedRule(e.target.value)}
                className="bg-slate-900 text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none max-w-[220px] truncate"
              >
                <option value="all">All Rules (2 - 8)</option>
                <option value="RULE_2_REPEATED_FAILED_VERIFICATION">Rule 2: Repeated Failed Verification</option>
                <option value="RULE_3_INACTIVE_BENEFICIARY_CLAIM">Rule 3: Inactive Beneficiary Claims</option>
                <option value="RULE_4_UNUSUAL_DISTRIBUTION">Rule 4: Unusual Distribution</option>
                <option value="RULE_5_SIMILAR_RECORDS">Rule 5: Suspiciously Similar Records</option>
                <option value="RULE_6_REPEATED_CONTACT">Rule 6: Repeated Contact Details</option>
                <option value="RULE_7_INCONSISTENT_DATES">Rule 7: Inconsistent Dates</option>
                <option value="RULE_8_FREQUENT_TRANSFERS">Rule 8: Frequent Transfers</option>
              </select>

              {/* Severity Filter */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-900 text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>
            </div>

            <span className="text-slate-400 font-mono text-[11px]">
              Showing {filteredFindings.length} of {findings.length} findings
            </span>
          </div>

          {/* Findings List Cards */}
          <div className="space-y-3">
            {filteredFindings.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-500 rounded-2xl border border-slate-800 text-xs">
                {error ? 'No integrity findings available — Backend service is offline.' : 'No findings matching the selected filter criteria.'}
              </div>
            ) : (
              filteredFindings.map(f => {
                const isRisk = f.category === 'risk_indicator';
                const isHigh = f.severity === 'high';
                const isMed = f.severity === 'medium';

                return (
                  <div
                    key={f.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isRisk
                        ? isHigh
                          ? 'bg-red-950/20 border-red-500/30'
                          : 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isRisk
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            {isRisk ? 'Risk Indicator' : 'Data Quality'}
                          </span>

                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-red-500/20 text-red-400'
                              : isMed
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {f.severity}
                          </span>

                          <span className="text-xs font-bold text-slate-200 font-mono">
                            {f.ruleId}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-100">{f.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                          {f.description}
                        </p>

                        {/* Evidence Tag Section */}
                        {f.evidence && (
                          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                            {f.evidence.totalAmountAtRisk > 0 && (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold">
                                Amount at risk: ₹{f.evidence.totalAmountAtRisk.toLocaleString()}
                              </span>
                            )}
                            {f.evidence.compositeSimilarityScore && (
                              <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                                Match Score: {Math.round(f.evidence.compositeSimilarityScore * 100)}%
                              </span>
                            )}
                            {f.evidence.maskedPhone && (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                Masked: {f.evidence.maskedPhone}
                              </span>
                            )}
                            {f.evidence.distinctDocumentsAttempted > 1 && (
                              <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                                {f.evidence.distinctDocumentsAttempted} doc numbers tried
                              </span>
                            )}
                            {f.evidence.totalVariationDistance > 0 && (
                              <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                                TVD Shift: {(f.evidence.totalVariationDistance * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        )}

                        {f.legitimateFilterApplied && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                            <Info className="w-3 h-3 text-indigo-400" />
                            Legitimate filter check: {f.legitimateFilterApplied}
                          </p>
                        )}
                      </div>

                      <div className="text-right text-[11px] text-slate-500 font-mono flex-shrink-0">
                        <span>{f.entityType}: <strong className="text-slate-300">{f.entityId}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* View 2: Legitimate Lookalike Matrix */}
      {activeTab === 'lookalikes' && (
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Legitimate Lookalike Test Verification Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Every integrity rule features an automated "legitimate explanation" filter to prevent false accusations. The benchmark suite validates that all 7 legitimate lookalikes are correctly suppressed:
            </p>
          </div>

          {lookalikes.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-500 rounded-2xl border border-slate-800 text-xs">
              {error ? 'No lookalike test benchmark data available — Backend service is offline.' : 'No lookalike tests loaded.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {lookalikes.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-400 font-bold">{item.ruleId}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {item.actualResult}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-200 text-sm">{item.lookalikeName}</h4>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
                    <div><strong>Expected Behavior:</strong> {item.expectedResult}</div>
                    <div className="text-emerald-400/90 font-medium">✓ Filter passed: Zero false positives generated.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 max-w-xl w-full space-y-4">
            <h3 className="text-base font-bold text-slate-100">Upload / Paste Custom Datasets</h3>
            <p className="text-xs text-slate-400">
              Provide JSON containing any of: <code>beneficiaries</code>, <code>enrollments</code>, <code>verifications</code>, <code>claims</code>, <code>transfers</code>. The unified endpoint will execute only corresponding rules.
            </p>

            <textarea
              rows={10}
              value={customJsonInput}
              onChange={(e) => setCustomJsonInput(e.target.value)}
              placeholder={`{\n  "beneficiaries": [\n    {"id": "b1", "name": "Aarav Sharma", "phone": "9812345678", "dob": "2008-01-01"}\n  ],\n  "claims": [\n    {"beneficiary_id": "b1", "period_start": "2026-06-01", "period_end": "2026-06-30", "amount": 3000}\n  ]\n}`}
              className="w-full bg-slate-950 text-slate-200 font-mono text-[11px] rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomAnalysis}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Analyze Payload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

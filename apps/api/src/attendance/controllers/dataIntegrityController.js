import { analyzeDataIntegrity, DEFAULT_SCHEME_CONFIG } from '../services/dataIntegrityEngine.js';
import { generateBenchmarkDataset, BENCHMARK_GROUND_TRUTH } from '../benchmark/syntheticBenchmark.js';

export function analyzeIntegrityEndpoint(req, res) {
  try {
    const payload = req.body || {};
    const result = analyzeDataIntegrity(payload);
    return res.json(result);
  } catch (err) {
    console.error('Data integrity analysis error:', err);
    return res.status(500).json({ error: 'Failed to execute data integrity analysis: ' + err.message });
  }
}

export function getIntegrityBenchmark(req, res) {
  try {
    const benchmarkData = generateBenchmarkDataset();
    return res.json({
      benchmarkData,
      groundTruth: BENCHMARK_GROUND_TRUTH,
      defaultConfig: DEFAULT_SCHEME_CONFIG
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function runBenchmarkEvaluation(req, res) {
  try {
    const customConfig = req.body?.config || {};
    const benchmarkData = generateBenchmarkDataset();
    const result = analyzeDataIntegrity({ ...benchmarkData, config: customConfig });

    const findings = result.findings || [];

    // Evaluate Lookalike suppression (Check if any lookalike was falsely flagged -> False Positive)
    const lookalikeEvaluations = BENCHMARK_GROUND_TRUTH.lookalikesExpectedSuppressed.map(item => {
      let isFalselyFlagged = false;
      let matchedFinding = null;

      if (item.entityId) {
        matchedFinding = findings.find(f => f.ruleId === item.ruleId && (f.entityId === item.entityId || f.entityId.includes(item.entityId.split(' ')[0])));
        isFalselyFlagged = Boolean(matchedFinding);
      } else if (item.ruleId === 'RULE_6_REPEATED_CONTACT') {
        // Check if sibling phone 9876500002 was flagged
        matchedFinding = findings.find(f => f.ruleId === item.ruleId && f.evidence?.maskedPhone?.includes('98******02'));
        isFalselyFlagged = Boolean(matchedFinding);
      }

      return {
        ruleId: item.ruleId,
        lookalikeName: item.lookalikeName,
        expectedResult: 'SUPPRESSED / NOT FLAGGED',
        actualResult: isFalselyFlagged ? 'FALSE POSITIVE (FLAGGED)' : 'PASS (SUPPRESSED)',
        status: isFalselyFlagged ? 'FAIL' : 'PASS',
        matchedFinding: matchedFinding || null
      };
    });

    const passedLookalikes = lookalikeEvaluations.filter(e => e.status === 'PASS').length;
    const totalLookalikes = lookalikeEvaluations.length;
    const lookalikeSuppressionRate = Number(((passedLookalikes / totalLookalikes) * 100).toFixed(1));

    // Evaluate True Positives detection
    const positiveEvaluations = BENCHMARK_GROUND_TRUTH.expectedFlags.map(item => {
      let isDetected = false;
      let matchedFinding = null;

      if (item.entityId) {
        matchedFinding = findings.find(f => f.ruleId === item.ruleId && (f.entityId === item.entityId || f.entityId.includes(item.entityId.split(' ')[0])));
        isDetected = Boolean(matchedFinding);
      } else if (item.ruleId === 'RULE_6_REPEATED_CONTACT') {
        matchedFinding = findings.find(f => f.ruleId === item.ruleId && f.category === 'risk_indicator');
        isDetected = Boolean(matchedFinding);
      }

      return {
        ruleId: item.ruleId,
        reason: item.reason,
        expected: 'FLAGGED',
        actual: isDetected ? 'DETECTED' : 'MISSED',
        status: isDetected ? 'PASS' : 'FAIL',
        finding: matchedFinding || null
      };
    });

    const truePositivesCount = positiveEvaluations.filter(e => e.status === 'PASS').length;
    const totalExpectedPositives = positiveEvaluations.length;
    const recallRate = Number(((truePositivesCount / totalExpectedPositives) * 100).toFixed(1));

    // Calculate Precision (True Positives / Total Risk Indicators)
    const riskIndicatorsCount = result.summary.riskIndicatorsCount;
    const precisionRate = riskIndicatorsCount > 0
      ? Number(((truePositivesCount / riskIndicatorsCount) * 100).toFixed(1))
      : 100;

    return res.json({
      summary: result.summary,
      rulesExecuted: result.rulesExecuted,
      benchmarkMetrics: {
        recallRate: `${recallRate}%`,
        precisionRate: `${precisionRate}%`,
        lookalikeSuppressionRate: `${lookalikeSuppressionRate}% (${passedLookalikes}/${totalLookalikes})`,
        truePositives: `${truePositivesCount}/${totalExpectedPositives}`,
        lookalikesSuppressed: `${passedLookalikes}/${totalLookalikes}`
      },
      lookalikeMatrix: lookalikeEvaluations,
      expectedPositivesMatrix: positiveEvaluations,
      findings: result.findings
    });

  } catch (err) {
    console.error('Benchmark run error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export function getIntegrityConfig(req, res) {
  return res.json({ config: DEFAULT_SCHEME_CONFIG });
}

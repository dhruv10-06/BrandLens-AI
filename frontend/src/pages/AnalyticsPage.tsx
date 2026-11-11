import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics.api.ts';
import { GovernanceMetrics } from '../types/index.ts';
import { Button } from '../components/common/Button.tsx';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Palette,
  HelpCircle,
  Lightbulb,
  ArrowUpRight,
  Flame,
  Calendar,
  RefreshCw,
  Compass,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getAnalytics();
      setMetrics(res.metrics);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load brand governance analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-espresso-600 gap-3">
        <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-espresso-700 font-mono">
          Loading Brand Governance Analytics...
        </span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 rounded-2xl bg-[#FDFBF7] border border-[#E2D7C5] text-center max-w-md mx-auto my-12 shadow-parchment">
        <AlertTriangle className="w-8 h-8 text-oxblood-700 mx-auto mb-2" />
        <h3 className="text-sm font-bold font-serif text-espresso-950">Failed to Load Analytics</h3>
        <p className="text-xs text-espresso-700 mt-1">{error || 'Unknown error occurred'}</p>
        <Button variant="primary" size="sm" onClick={fetchAnalytics} className="mt-4">
          Retry Aggregation
        </Button>
      </div>
    );
  }

  const {
    kpis,
    statusDistribution,
    categoryBreakdown,
    severityBreakdown,
    visualMetrics,
    recurringViolations,
    guidelineGaps,
    timelineTrend,
    policyRecommendations,
  } = metrics;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E2D7C5]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EFE4] border border-[#DDD2BF] text-forest-900 text-[11px] font-bold uppercase tracking-widest font-mono">
            <BarChart3 className="w-3.5 h-3.5 text-brass-700" />
            <span>Organization Analytics &amp; Insights</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-espresso-950 tracking-tight">
            Brand Analytics
          </h1>
          <p className="text-xs sm:text-sm text-espresso-700">
            Real-time compliance analytics, recurring violation trends, guideline gap detection, and visual compliance statistics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          icon={<RefreshCw className="w-3.5 h-3.5 text-brass-700" />}
        >
          Refresh Analytics
        </Button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="p-5 sm:p-6 bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 font-mono">
              Avg Compliance Score
            </div>
            <div className="text-3xl font-bold font-mono text-espresso-950 mt-1 tabular-nums">
              {kpis.averageComplianceScore}%
            </div>
            <div className="text-[11px] text-espresso-700 mt-0.5">Across all audited campaigns</div>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
              kpis.averageComplianceScore >= 85
                ? 'bg-forest-100 text-forest-900 border border-forest-300'
                : 'bg-brass-100 text-brass-900 border border-brass-300'
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Approval Rate */}
        <div className="p-5 sm:p-6 bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 font-mono">
              Review Approval Rate
            </div>
            <div className="text-3xl font-bold font-mono text-espresso-950 mt-1 tabular-nums">
              {kpis.approvalRate}%
            </div>
            <div className="text-[11px] text-espresso-700 mt-0.5 font-mono">
              {statusDistribution.approved} of {kpis.totalSubmissions} approved
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-forest-100 border border-forest-300 flex items-center justify-center text-forest-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Critical Violations */}
        <div className="p-5 sm:p-6 bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 font-mono">
              Critical Violations
            </div>
            <div className="text-3xl font-bold font-mono text-espresso-950 mt-1 tabular-nums">
              {kpis.criticalViolationsCount}
            </div>
            <div className="text-[11px] text-espresso-700 mt-0.5 font-mono">
              {kpis.totalViolationsDetected} total issues detected
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              kpis.criticalViolationsCount > 0
                ? 'bg-oxblood-100 text-oxblood-900 border border-oxblood-300'
                : 'bg-[#F5EFE4] text-espresso-600 border border-[#DDD2BF]'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Visual Compliance Score */}
        <div className="p-5 sm:p-6 bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 font-mono">
              Visual Brand Score
            </div>
            <div className="text-3xl font-bold font-mono text-espresso-950 mt-1 tabular-nums">
              {visualMetrics.totalVisualAssets > 0 ? `${visualMetrics.averageVisualScore}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-espresso-700 mt-0.5 font-mono">
              {visualMetrics.totalVisualAssets} visual creative(s) audited
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brass-100 border border-brass-300 flex items-center justify-center text-brass-800">
            <Palette className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Row: Trend Line & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Trend Chart */}
        <div className="lg:col-span-2 bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
                7-Day Compliance Score Trajectory
              </h2>
              <p className="text-xs text-espresso-700 mt-0.5">Rolling average score trend across recent submissions</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-espresso-800 font-mono bg-[#F5EFE4] px-2.5 py-1 rounded-lg border border-[#DDD2BF]">
              <Calendar className="w-3.5 h-3.5 text-brass-700" />
              <span>Past 7 Days</span>
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="h-48 w-full pt-4">
            <svg viewBox="0 0 700 180" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="680" y2="20" stroke="#E2D7C5" strokeDasharray="3 3" />
              <text x="10" y="24" fill="#8E8271" fontSize="10" fontFamily="monospace">100%</text>

              <line x1="40" y1="80" x2="680" y2="80" stroke="#E2D7C5" strokeDasharray="3 3" />
              <text x="10" y="84" fill="#8E8271" fontSize="10" fontFamily="monospace">80%</text>

              <line x1="40" y1="140" x2="680" y2="140" stroke="#E2D7C5" strokeDasharray="3 3" />
              <text x="10" y="144" fill="#8E8271" fontSize="10" fontFamily="monospace">60%</text>

              {/* Data Path */}
              {timelineTrend.length > 1 && (
                <>
                  <path
                    d={timelineTrend.reduce((acc, pt, idx) => {
                      const x = 50 + idx * (620 / (timelineTrend.length - 1));
                      const y = 160 - ((Math.max(50, pt.averageScore) - 50) / 50) * 140;
                      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#243C32"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  {/* Data Points */}
                  {timelineTrend.map((pt, idx) => {
                    const x = 50 + idx * (620 / (timelineTrend.length - 1));
                    const y = 160 - ((Math.max(50, pt.averageScore) - 50) / 50) * 140;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="5" fill="#243C32" stroke="#FAF7F0" strokeWidth="2.5" />
                        <text x={x} y={175} textAnchor="middle" fill="#615248" fontSize="11" fontFamily="monospace" fontWeight="600">
                          {pt.date}
                        </text>
                        <text x={x} y={y - 10} textAnchor="middle" fill="#30251F" fontSize="11" fontFamily="monospace" fontWeight="700">
                          {pt.averageScore}%
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Severity Matrix */}
        <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment space-y-4">
          <div>
            <h2 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
              Severity Distribution
            </h2>
            <p className="text-xs text-espresso-700 mt-0.5">Issues breakdown by business impact</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { label: 'Critical', count: severityBreakdown.Critical, color: 'bg-oxblood-800', text: 'text-oxblood-900' },
              { label: 'High', count: severityBreakdown.High, color: 'bg-oxblood-600', text: 'text-oxblood-800' },
              { label: 'Medium', count: severityBreakdown.Medium, color: 'bg-brass-600', text: 'text-brass-900' },
              { label: 'Low', count: severityBreakdown.Low, color: 'bg-olive-600', text: 'text-olive-900' },
            ].map((sev) => {
              const total = kpis.totalViolationsDetected || 1;
              const pct = Math.round((sev.count / total) * 100);
              return (
                <div key={sev.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={sev.text}>{sev.label}</span>
                    <span className="text-espresso-700 font-mono tabular-nums">{sev.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EAE1D2] overflow-hidden">
                    <div className={`h-full rounded-full ${sev.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Compliance Summary */}
          <div className="pt-3.5 border-t border-[#EDE6D8] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 font-mono">
              Visual Health Diagnostics
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#DDD2BF]">
                <div className="text-xs font-bold font-mono text-espresso-950">{visualMetrics.colorViolationCount}</div>
                <div className="text-[10px] text-espresso-600 mt-0.5 font-medium">Color Drifts</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#DDD2BF]">
                <div className="text-xs font-bold font-mono text-espresso-950">{visualMetrics.logoViolationCount}</div>
                <div className="text-[10px] text-espresso-600 mt-0.5 font-medium">Logo Misuse</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#DDD2BF]">
                <div className="text-xs font-bold font-mono text-espresso-950">{visualMetrics.typographyViolationCount}</div>
                <div className="text-[10px] text-espresso-600 mt-0.5 font-medium">Typography</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Violation Category Breakdown */}
      <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment space-y-4">
        <div>
          <h2 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
            Violations by Brand Category
          </h2>
          <p className="text-xs text-espresso-700 mt-0.5">
            Empirical distribution of brand guideline discrepancies across all campaigns
          </p>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="p-8 text-center text-xs text-espresso-600 font-mono">
            No brand violations recorded yet. All submissions are fully compliant!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD2BF] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-espresso-950 font-serif">{cat.category}</span>
                  <span className="font-bold font-mono text-forest-900 tabular-nums">{cat.count} issues ({cat.percentage}%)</span>
                </div>
                <div className="h-2 rounded-full bg-[#EAE1D2] overflow-hidden">
                  <div className="h-full rounded-full bg-forest-800" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Grid: Recurring Violations & Policy Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Violations Leaderboard */}
        <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-oxblood-700" />
            <h2 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
              Recurring Brand Inconsistencies
            </h2>
          </div>
          <p className="text-xs text-espresso-700 -mt-2">
            Repeatedly detected terms, unverified statements, or visual discrepancies
          </p>

          {recurringViolations.length === 0 ? (
            <div className="p-8 text-center text-xs text-espresso-600 font-mono">
              No recurring violations detected across campaigns.
            </div>
          ) : (
            <div className="divide-y divide-[#EDE6D8]">
              {recurringViolations.map((item, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FAF7F0] text-espresso-900 border border-[#DDD2BF]">
                        "{item.phraseOrRule}"
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brass-100 text-brass-900 border border-brass-300 font-mono">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-espresso-600 line-clamp-1 italic font-serif">"{item.sampleContext}"</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold font-mono text-forest-900 px-2.5 py-1 rounded-lg bg-forest-100 border border-forest-300">
                      {item.occurrences}x detected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Policy Recommendations & Guideline Gaps */}
        <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-brass-700" />
            <h2 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
              Governance Policy Recommendations
            </h2>
          </div>
          <p className="text-xs text-espresso-700 -mt-2">
            Actionable brand manual updates derived from empirical review patterns
          </p>

          <div className="space-y-3">
            {policyRecommendations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD2BF] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono ${
                    rec.priority === 'Urgent'
                      ? 'bg-oxblood-100 text-oxblood-900 border border-oxblood-300'
                      : rec.priority === 'High'
                      ? 'bg-brass-100 text-brass-900 border border-brass-300'
                      : 'bg-forest-100 text-forest-900 border border-forest-300'
                  }`}>
                    {rec.priority} Priority
                  </span>
                  <span className="text-[11px] font-semibold text-espresso-600 font-mono">{rec.area}</span>
                </div>
                <h3 className="text-xs font-bold font-serif text-espresso-950">{rec.title}</h3>
                <p className="text-xs text-espresso-700 leading-relaxed font-sans">{rec.description}</p>
                <div className="text-[11px] font-semibold text-forest-900 flex items-center gap-1 pt-1 font-mono">
                  <ArrowUpRight className="w-3.5 h-3.5 text-brass-700" />
                  <span>Impact: {rec.impact}</span>
                </div>
              </div>
            ))}

            {guidelineGaps.length > 0 && (
              <div className="p-4 rounded-xl bg-brass-50 border border-brass-300 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brass-900">
                  <HelpCircle className="w-3.5 h-3.5 text-brass-700" />
                  <span>Missing Guideline Verification Gaps</span>
                </div>
                <p className="text-xs text-espresso-800 leading-relaxed">
                  The following statements were frequently claimed by creators but lack verification in uploaded brand documents:
                </p>
                <ul className="text-xs text-espresso-900 space-y-1 list-disc list-inside">
                  {guidelineGaps.map((gap, i) => (
                    <li key={i}>
                      <span className="font-semibold">"{gap.topicOrClaim}"</span> ({gap.frequency}x unverified)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics.api.ts';
import { GovernanceMetrics } from '../types/index.ts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Palette,
  FileText,
  HelpCircle,
  Lightbulb,
  ArrowUpRight,
  Flame,
  Calendar,
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Aggregating organisation brand compliance metrics...</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Failed to load analytics</h3>
        <p className="text-xs text-red-700 mt-1">{error || 'Unknown error occurred'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis, statusDistribution, categoryBreakdown, severityBreakdown, visualMetrics, recurringViolations, guidelineGaps, timelineTrend, policyRecommendations } = metrics;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Organisation Governance Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Brand Governance & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time telemetry, recurring violation trends, guideline gap detection, and visual compliance statistics.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Compliance Score</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {kpis.averageComplianceScore}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across all audited campaigns</div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${
            kpis.averageComplianceScore >= 85 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Approval Rate */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Review Approval Rate</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {kpis.approvalRate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{statusDistribution.approved} approved of {kpis.totalSubmissions} submissions</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Critical Violations */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Critical Violations</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {kpis.criticalViolationsCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{kpis.totalViolationsDetected} total issues detected</div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            kpis.criticalViolationsCount > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Visual Compliance Score */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Visual Brand Score</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {visualMetrics.totalVisualAssets > 0 ? `${visualMetrics.averageVisualScore}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{visualMetrics.totalVisualAssets} visual creative(s) audited</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Palette className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Row: Trend Line & Violation Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">7-Day Compliance Score Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Average score trajectory across recent campaign submissions</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Past 7 Days</span>
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="h-48 w-full pt-4">
            <svg viewBox="0 0 700 180" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="680" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
              <text x="10" y="24" fill="#94A3B8" fontSize="10">100%</text>

              <line x1="40" y1="80" x2="680" y2="80" stroke="#E2E8F0" strokeDasharray="3 3" />
              <text x="10" y="84" fill="#94A3B8" fontSize="10">80%</text>

              <line x1="40" y1="140" x2="680" y2="140" stroke="#E2E8F0" strokeDasharray="3 3" />
              <text x="10" y="144" fill="#94A3B8" fontSize="10">60%</text>

              {/* Data Path */}
              {timelineTrend.length > 1 && (
                <>
                  <path
                    d={timelineTrend.reduce((acc, pt, idx) => {
                      const x = 50 + idx * (620 / (timelineTrend.length - 1));
                      // Normalize score 50-100 to y 160-20
                      const y = 160 - ((Math.max(50, pt.averageScore) - 50) / 50) * 140;
                      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Data Points */}
                  {timelineTrend.map((pt, idx) => {
                    const x = 50 + idx * (620 / (timelineTrend.length - 1));
                    const y = 160 - ((Math.max(50, pt.averageScore) - 50) / 50) * 140;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
                        <text x={x} y={175} textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="500">
                          {pt.date}
                        </text>
                        <text x={x} y={y - 10} textAnchor="middle" fill="#1E293B" fontSize="11" fontWeight="700">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Severity Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">Issues breakdown by business impact</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { label: 'Critical', count: severityBreakdown.Critical, color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
              { label: 'High', count: severityBreakdown.High, color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
              { label: 'Medium', count: severityBreakdown.Medium, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Low', count: severityBreakdown.Low, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
            ].map((sev) => {
              const total = kpis.totalViolationsDetected || 1;
              const pct = Math.round((sev.count / total) * 100);
              return (
                <div key={sev.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={sev.text}>{sev.label}</span>
                    <span className="text-slate-600">{sev.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${sev.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Compliance Summary */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Visual Health Diagnostics</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-extrabold text-slate-900">{visualMetrics.colorViolationCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Color Drifts</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-extrabold text-slate-900">{visualMetrics.logoViolationCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Logo Misuse</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-extrabold text-slate-900">{visualMetrics.typographyViolationCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Typography</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Violation Category Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Violations by Brand Category</h2>
          <p className="text-xs text-slate-400 mt-0.5">Empirical distribution of brand guideline discrepancies across all campaigns</p>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No brand violations recorded yet. All submissions are fully compliant!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{cat.category}</span>
                  <span className="font-extrabold text-indigo-600">{cat.count} issues ({cat.percentage}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Grid: Recurring Violations & Policy Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Violations Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-slate-900">Recurring Brand Inconsistencies</h2>
          </div>
          <p className="text-xs text-slate-400 -mt-2">Repeatedly detected terms, unverified statements, or visual discrepancies</p>

          {recurringViolations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No recurring violations detected across campaigns.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recurringViolations.map((item, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        "{item.phraseOrRule}"
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.sampleContext}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-slate-900 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {item.occurrences}x detected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Policy Recommendations & Guideline Gaps */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Governance Policy Recommendations</h2>
          </div>
          <p className="text-xs text-slate-400 -mt-2">Actionable brand manual updates derived from empirical review patterns</p>

          <div className="space-y-3">
            {policyRecommendations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    rec.priority === 'Urgent'
                      ? 'bg-red-100 text-red-800'
                      : rec.priority === 'High'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {rec.priority} Priority
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">{rec.area}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900">{rec.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 pt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Impact: {rec.impact}</span>
                </div>
              </div>
            ))}

            {guidelineGaps.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Missing Guideline Verification Gaps</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  The following statements were frequently claimed by creators but lack verification in uploaded brand documents:
                </p>
                <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
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


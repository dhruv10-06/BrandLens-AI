import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { orgApi } from '../api/org.api.ts';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentSubmission } from '../types/index.ts';
import { StatusBadge } from '../components/common/Badge.tsx';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { Button } from '../components/common/Button.tsx';
import {
  FileText,
  BookOpen,
  CheckCircle,
  ArrowRight,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Clock,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ documents: number; factsAndRules: number; submissions: number }>({
    documents: 0,
    factsAndRules: 0,
    submissions: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<ContentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [orgRes, subRes] = await Promise.all([
          orgApi.getOrganization(),
          submissionsApi.getSubmissions(),
        ]);
        setStats(orgRes.stats);
        setRecentSubmissions(subRes.submissions.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Editorial Executive Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-elevated border border-slate-800/80 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold mb-3 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Autonomous Brand Governance Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed font-normal">
            BrandLens AI audits marketing copy, visuals, and announcements against approved guidelines, tone rules, and verified organization facts prior to publication.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/submissions/new">
              <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
                Submit Content for Review
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="accent" size="md" icon={<BarChart3 className="w-4 h-4" />}>
                Brand Analytics
              </Button>
            </Link>
            <Link to="/guidelines">
              <Button variant="outline" size="md" icon={<BookOpen className="w-4 h-4" />} className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700">
                View Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Brand Guidelines
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1 tabular-nums tracking-tight">
              {stats.documents}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Indexed PDF & TXT documents</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Verified Rules & Terms
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1 tabular-nums tracking-tight">
              {stats.factsAndRules}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Prohibited & approved terms</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Audited Submissions
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1 tabular-nums tracking-tight">
              {stats.submissions}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">AI audited & human reviewed</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <Link
          to="/analytics"
          className="bg-white p-5 rounded-xl border border-indigo-200/90 shadow-card hover:border-indigo-400 hover:shadow-card-hover transition-all duration-200 flex items-center justify-between group"
        >
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
              Governance Telemetry
            </div>
            <div className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
              <span>View Insights</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Trends, gaps & recurring issues</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform flex-shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Preloaded Demo Submission Highlight */}
      {recentSubmissions.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center text-amber-800 flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mb-0.5">
                Evaluator Case Ready for Review
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {recentSubmissions[0].title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 italic">
                "{recentSubmissions[0].originalContent}"
              </p>
            </div>
          </div>
          <Link
            to={`/submissions/${recentSubmissions[0]._id}/analysis`}
            className="flex-shrink-0"
          >
            <Button variant="secondary" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
              Inspect AI Audit
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Submissions Table */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Content Submissions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest campaign copy and creative assets undergoing governance</p>
          </div>
          <Link
            to="/submissions"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No submissions recorded yet. Submit your first content copy to run the brand governance pipeline.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentSubmissions.map((sub) => (
              <div
                key={sub._id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">{sub.title}</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60 uppercase tracking-wide">
                      {sub.contentType.replace('_', ' ')}
                    </span>
                    {sub.submissionFormat && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {sub.submissionFormat}
                      </span>
                    )}
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 italic">
                    "{sub.currentContent}"
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                  {sub.latestAnalysisId?.overallComplianceScore !== undefined && (
                    <ScoreGauge score={sub.latestAnalysisId.overallComplianceScore} size="sm" />
                  )}
                  <Link to={`/submissions/${sub._id}/analysis`}>
                    <Button variant="outline" size="sm">
                      Audit Report
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

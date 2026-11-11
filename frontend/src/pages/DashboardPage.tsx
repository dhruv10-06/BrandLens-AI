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
  Layers,
  ArrowUpRight,
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
    <div className="space-y-7">
      {/* Editorial Executive Hero Banner */}
      <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-br from-white via-ivory-50 to-lavender-50/40 text-graphite-900 shadow-card border border-[#EAE8E3] relative overflow-hidden">
        {/* Soft decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-gradient-to-bl from-lavender-200/30 via-champagne-200/20 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold mb-3 tracking-wide uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Autonomous Brand Governance Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-graphite-900 leading-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-graphite-600 leading-relaxed font-normal">
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
              <Button variant="outline" size="md" icon={<BookOpen className="w-4 h-4" />}>
                View Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Asymmetric Metrics Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Brand Guidelines */}
        <div className="bg-white p-6 rounded-2xl border border-[#EAE8E3] shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-graphite-400 font-mono">
                Brand Knowledge Base
              </div>
              <div className="text-3xl font-extrabold font-mono text-graphite-900 mt-2 tabular-nums tracking-tight">
                {stats.documents}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-lavender-50 border border-lavender-100 flex items-center justify-center text-brand-600 flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-[#F2EFE8] flex items-center justify-between text-xs text-graphite-500">
            <span>Indexed PDF &amp; TXT documents</span>
            <Link to="/guidelines" className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
              <span>Inspect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric 2: Verified Rules & Terms */}
        <div className="bg-white p-6 rounded-2xl border border-[#EAE8E3] shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-graphite-400 font-mono">
                Verified Rules &amp; Facts
              </div>
              <div className="text-3xl font-extrabold font-mono text-graphite-900 mt-2 tabular-nums tracking-tight">
                {stats.factsAndRules}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-[#F2EFE8] flex items-center justify-between text-xs text-graphite-500">
            <span>Prohibited &amp; approved terms</span>
            <Link to="/guidelines" className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5">
              <span>Rules</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric 3: Audited Submissions & Telemetry */}
        <div className="bg-white p-6 rounded-2xl border border-brand-200/90 shadow-card hover:border-brand-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 font-mono">
                Audited Submissions
              </div>
              <div className="text-3xl font-extrabold font-mono text-graphite-900 mt-2 tabular-nums tracking-tight">
                {stats.submissions}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 group-hover:scale-105 transition-transform flex-shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-[#F2EFE8] flex items-center justify-between text-xs text-graphite-500">
            <span>AI audited &amp; reviewed</span>
            <Link to="/analytics" className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
              <span>Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Preloaded Demo Submission Highlight */}
      {recentSubmissions.length > 0 && (
        <div className="bg-champagne-50/80 border border-champagne-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-champagne-200/80 border border-champagne-300/80 flex items-center justify-center text-graphite-900 flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-champagne-800" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-champagne-800 mb-0.5 font-mono">
                Evaluator Case Ready for Review
              </div>
              <h3 className="text-sm sm:text-base font-bold text-graphite-900 tracking-tight">
                {recentSubmissions[0].title}
              </h3>
              <p className="text-xs text-graphite-600 mt-0.5 line-clamp-1 italic">
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
      <div className="bg-white rounded-2xl border border-[#EAE8E3] shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[#F2EFE8] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-graphite-900 tracking-tight">Recent Content Submissions</h2>
            <p className="text-xs text-graphite-500 mt-0.5">Latest campaign copy and creative assets undergoing governance</p>
          </div>
          <Link
            to="/submissions"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors font-mono"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-graphite-400">
            No submissions recorded yet. Submit your first content copy to run the brand governance pipeline.
          </div>
        ) : (
          <div className="divide-y divide-[#F2EFE8]">
            {recentSubmissions.map((sub) => (
              <div
                key={sub._id}
                className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ivory-50/60 transition-colors"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-graphite-900 tracking-tight">{sub.title}</span>
                    <span className="text-[10px] font-bold text-graphite-600 bg-ivory-100 px-2 py-0.5 rounded border border-[#EAE8E3] uppercase tracking-wide font-mono">
                      {sub.contentType.replace('_', ' ')}
                    </span>
                    {sub.submissionFormat && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-lavender-50 text-brand-700 border border-lavender-200 font-mono">
                        {sub.submissionFormat}
                      </span>
                    )}
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-graphite-600 line-clamp-1 italic">
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
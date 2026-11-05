import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { orgApi } from '../api/org.api.ts';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentSubmission } from '../types/index.ts';
import { StatusBadge } from '../components/common/Badge.tsx';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import {
  FileText,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  Clock,
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
      {/* Top Banner with Brand Identity */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Intelligent Brand Governance Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            BrandLens AI automatically audits outbound copy against your approved brand guidelines, tone rules, and verified facts before publication.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/submissions/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Content for Review</span>
            </Link>
            <Link
              to="/guidelines"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Approved Guidelines</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Approved Brand Guidelines
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.documents}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Indexed PDF & TXT documents</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verified Rules & Terminology
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.factsAndRules}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Prohibited & approved terms</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audited Submissions
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.submissions}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">AI analyzed & human reviewed</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Preloaded Demo Submission Highlight */}
      {recentSubmissions.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Sample Governance Case Ready for Review
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {recentSubmissions[0].title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                "{recentSubmissions[0].originalContent}"
              </p>
            </div>
          </div>
          <Link
            to={`/submissions/${recentSubmissions[0]._id}/analysis`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex-shrink-0"
          >
            <span>Inspect AI Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Recent Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Content Submissions</h2>
          <Link
            to="/submissions"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No submissions recorded yet. Submit your first content copy to run the brand governance pipeline.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSubmissions.map((sub) => (
              <div
                key={sub._id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{sub.title}</span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {sub.contentType.replace('_', ' ')}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 italic">
                    "{sub.currentContent}"
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {sub.latestAnalysisId?.overallComplianceScore !== undefined && (
                    <ScoreGauge score={sub.latestAnalysisId.overallComplianceScore} size="sm" />
                  )}
                  <Link
                    to={`/submissions/${sub._id}/analysis`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    View Details
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


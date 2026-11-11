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
  BookOpen,
  CheckCircle,
  ArrowRight,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Compass,
  ArrowUpRight,
  FileCheck2,
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
    <div className="space-y-8">
      {/* Editorial Masthead & Status Header */}
      <div className="p-8 sm:p-10 rounded-2xl bg-[#F5EFE4] text-espresso-950 border border-[#E2D7C5] shadow-parchment relative overflow-hidden">
        {/* Antique brass glow wash */}
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-brass-200/30 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#DDD2BF] text-forest-900 text-xs font-semibold font-mono">
            <Sparkles className="w-3.5 h-3.5 text-brass-700" />
            <span>Brand Governance • Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-espresso-950 tracking-tight leading-[1.15]">
            Welcome to the Atelier, {user?.name}
          </h1>
          <p className="text-sm sm:text-base text-espresso-800 leading-relaxed font-sans max-w-2xl">
            BrandLens AI autonomously audits your creative assets, claims, and campaign copy against indexed brand guidelines and verified organizational facts prior to public distribution.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/submissions/new">
              <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4 text-brass-400" />}>
                Submit Content for Audit
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="accent" size="md" icon={<BarChart3 className="w-4 h-4" />}>
                Brand Analytics
              </Button>
            </Link>
            <Link to="/guidelines">
              <Button variant="outline" size="md" icon={<BookOpen className="w-4 h-4 text-brass-700" />}>
                Inspect Brand Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Asymmetric Governance Overview & Case Docket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Brand Knowledge Base & Metrics */}
        <div className="lg:col-span-7 bg-[#FDFBF7] p-7 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brass-800 font-mono">
                Brand Knowledge Base
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-forest-900 font-semibold font-mono">
                <span className="w-2 h-2 rounded-full bg-forest-800 animate-pulse" />
                Vector Store Synced
              </span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-espresso-950 tracking-tight">
              Governance Overview
            </h2>
            <p className="text-xs text-espresso-700 leading-relaxed">
              Real-time compliance overview across all indexed guideline documents, brand rules, and audited creative assets.
            </p>
          </div>

          {/* Three Analytics Facets */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#EDE6D8]">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-espresso-600 font-mono tracking-wider">
                Guideline Docs
              </span>
              <div className="text-3xl font-bold font-mono text-espresso-950 tabular-nums">
                {stats.documents}
              </div>
              <p className="text-[11px] text-espresso-700">Indexed PDF / TXT</p>
            </div>

            <div className="space-y-1 border-x border-[#EDE6D8] px-4">
              <span className="text-[10px] uppercase font-bold text-espresso-600 font-mono tracking-wider">
                Brand Rules
              </span>
              <div className="text-3xl font-bold font-mono text-espresso-950 tabular-nums">
                {stats.factsAndRules}
              </div>
              <p className="text-[11px] text-espresso-700">Prohibited &amp; Facts</p>
            </div>

            <div className="space-y-1 pl-2">
              <span className="text-[10px] uppercase font-bold text-espresso-600 font-mono tracking-wider">
                Audited Copy
              </span>
              <div className="text-3xl font-bold font-mono text-espresso-950 tabular-nums">
                {stats.submissions}
              </div>
              <p className="text-[11px] text-espresso-700">Campaign Assets</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-espresso-700">All guidelines vectorized in MongoDB with cosine embeddings</span>
            <Link to="/guidelines" className="font-semibold text-forest-800 hover:text-forest-900 flex items-center gap-1 underline underline-offset-2">
              <span>Inspect Vector Chunks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column (5 cols): Evaluator Spotlight Docket */}
        <div className="lg:col-span-5 bg-[#F5EFE4] p-7 sm:p-8 rounded-2xl border border-[#CCA678] shadow-parchment flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brass-800 font-mono">
                CodeNexus Evaluator Case
              </span>
              <span className="text-[10px] font-bold uppercase bg-brass-200 text-brass-900 px-2 py-0.5 rounded font-mono">
                Live Audit
              </span>
            </div>

            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-bold font-serif text-espresso-950 tracking-tight">
                  {recentSubmissions[0].title}
                </h3>
                <div className="p-3.5 rounded-lg bg-[#FAF7F0] border border-[#DDD2BF] text-xs">
                  <span className="text-[10px] font-mono text-espresso-600 uppercase font-bold block mb-1">
                    Submitted Content Excerpt:
                  </span>
                  <p className="text-espresso-800 italic line-clamp-2 font-serif">
                    "{recentSubmissions[0].originalContent}"
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={recentSubmissions[0].status} />
                  {recentSubmissions[0].latestAnalysisId?.overallComplianceScore !== undefined && (
                    <span className="text-xs font-mono font-bold text-espresso-800 bg-[#EAE1D2] px-2 py-0.5 rounded border border-[#DDD2BF]">
                      Score: {recentSubmissions[0].latestAnalysisId.overallComplianceScore}%
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <p className="text-xs text-espresso-700 leading-relaxed">
                  No active submissions found. Ready to audit your first campaign with multimodal analysis.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#DDD2BF]">
            {recentSubmissions.length > 0 ? (
              <Link to={`/submissions/${recentSubmissions[0]._id}/analysis`}>
                <Button variant="primary" size="md" className="w-full" iconRight={<ArrowRight className="w-4 h-4 text-brass-400" />}>
                  Inspect Complete AI Audit
                </Button>
              </Link>
            ) : (
              <Link to="/submissions/new">
                <Button variant="primary" size="md" className="w-full" iconRight={<PlusCircle className="w-4 h-4 text-brass-400" />}>
                  Create Sample Submission
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment overflow-hidden">
        <div className="p-6 sm:px-8 border-b border-[#EDE6D8] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-serif text-espresso-950 tracking-tight">
              Recent Submissions
            </h2>
            <p className="text-xs text-espresso-700 mt-0.5">
              Campaign copy and creative assets undergoing pre-publication governance
            </p>
          </div>
          <Link
            to="/submissions"
            className="text-xs font-semibold text-forest-800 hover:text-forest-900 flex items-center gap-1 transition-colors font-mono"
          >
            <span>View All Assets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-espresso-600">
            No submissions recorded yet. Submit your first content copy to initiate the brand governance pipeline.
          </div>
        ) : (
          <div className="divide-y divide-[#EDE6D8]">
            {recentSubmissions.map((sub) => (
              <div
                key={sub._id}
                className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5EFE4]/60 transition-colors"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-espresso-950 font-serif tracking-tight">
                      {sub.title}
                    </span>
                    <span className="text-[10px] font-bold text-espresso-700 bg-[#EAE1D2] px-2 py-0.5 rounded border border-[#DDD2BF] uppercase tracking-wide font-mono">
                      {sub.contentType.replace('_', ' ')}
                    </span>
                    {sub.submissionFormat && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brass-100 text-brass-900 border border-brass-300 font-mono">
                        {sub.submissionFormat}
                      </span>
                    )}
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-espresso-700 line-clamp-1 italic font-serif">
                    "{sub.currentContent}"
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                  {sub.latestAnalysisId?.overallComplianceScore !== undefined && (
                    <ScoreGauge score={sub.latestAnalysisId.overallComplianceScore} size="sm" />
                  )}
                  <Link to={`/submissions/${sub._id}/analysis`}>
                    <Button variant="outline" size="sm">
                      Audit Dossier
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

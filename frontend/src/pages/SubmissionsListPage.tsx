import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentSubmission } from '../types/index.ts';
import { StatusBadge } from '../components/common/Badge.tsx';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { FileText, Plus, Search, Filter, ArrowRight } from 'lucide-react';

export const SubmissionsListPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const res = await submissionsApi.getSubmissions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setSubmissions(res.submissions);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const filtered = submissions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.currentContent.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Brand Governance Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track all submitted marketing copy, articles, and announcements through the audit lifecycle.
          </p>
        </div>

        <Link
          to="/submissions/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Submission</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search copy or titles..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="needs_changes">Needs Changes</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No submissions found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((sub) => (
              <div
                key={sub._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
              >
                <div className="space-y-1.5 flex-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{sub.title}</span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded capitalize">
                      {sub.contentType.replace('_', ' ')}
                    </span>
                    {sub.submissionFormat && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {sub.submissionFormat}
                      </span>
                    )}
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    "{sub.currentContent}"
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>By {sub.creatorId?.name || 'Creator'}</span>
                    <span>•</span>
                    <span>Version {sub.version}</span>
                    <span>•</span>
                    <span>Updated {new Date(sub.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  {sub.latestAnalysisId?.overallComplianceScore !== undefined && (
                    <ScoreGauge score={sub.latestAnalysisId.overallComplianceScore} size="sm" />
                  )}
                  <Link
                    to={`/submissions/${sub._id}/analysis`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                  >
                    <span>{sub.latestAnalysisId ? 'View Analysis' : 'View / Analyze Draft'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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


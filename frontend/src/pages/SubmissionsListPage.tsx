import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentSubmission } from '../types/index.ts';
import { StatusBadge } from '../components/common/Badge.tsx';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { Button } from '../components/common/Button.tsx';
import { FileText, Plus, Search, Filter, ArrowRight, Clock, Layers } from 'lucide-react';

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

  const filtered = submissions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.currentContent.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2D7C5]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EFE4] border border-[#DDD2BF] text-forest-900 text-[11px] font-bold uppercase tracking-widest font-mono">
            <Layers className="w-3.5 h-3.5 text-brass-700" />
            <span>Creative Content Portfolio</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-espresso-950 tracking-tight">
            Brand Governance Submissions
          </h1>
          <p className="text-xs sm:text-sm text-espresso-700">
            Track all submitted marketing copy, campaign briefs, and creative visual assets through the audit lifecycle.
          </p>
        </div>

        <Link to="/submissions/new" className="self-start sm:self-auto">
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4 text-brass-400" />}>
            New Campaign Submission
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#FDFBF7] p-4 sm:p-5 rounded-2xl border border-[#E2D7C5] shadow-parchment flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-brass-700 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search copy, campaign, or title..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-[#DDD2BF] focus:outline-none focus:border-brass-600 focus:ring-1 focus:ring-brass-600/30 bg-[#FAF7F0] text-espresso-950 placeholder:text-espresso-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-brass-700" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3.5 py-2 rounded-lg border border-[#DDD2BF] bg-[#FAF7F0] font-semibold text-espresso-800 focus:outline-none focus:border-brass-600 shadow-parchment-sm cursor-pointer font-mono"
          >
            <option value="all">All Governance Statuses</option>
            <option value="draft">Draft</option>
            <option value="analysing">Auditing Content...</option>
            <option value="needs_changes">Changes Required</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions Table / List */}
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-espresso-600 font-mono">Loading submissions portfolio...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F5EFE4] border border-[#DDD2BF] text-espresso-600 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6 text-brass-700" />
            </div>
            <h3 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
              No Submissions Found
            </h3>
            <p className="text-xs text-espresso-700 max-w-sm mx-auto leading-relaxed">
              {search || statusFilter !== 'all'
                ? 'No items matched your search query or filter criteria. Try resetting the filter.'
                : 'Get started by submitting your first marketing copy or creative asset for automated brand compliance.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE6D8]">
            {filtered.map((sub) => (
              <div
                key={sub._id}
                className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5EFE4]/60 transition-colors"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold font-serif text-espresso-950 tracking-tight">
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
                  <p className="text-xs text-espresso-700 line-clamp-2 leading-relaxed italic font-serif">
                    "{sub.currentContent}"
                  </p>
                  <div className="text-[11px] text-espresso-600 flex items-center gap-3 pt-0.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brass-700" />
                      {new Date(sub.updatedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>Revision v{sub.version}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  {sub.latestAnalysisId?.overallComplianceScore !== undefined && (
                    <ScoreGauge score={sub.latestAnalysisId.overallComplianceScore} size="sm" />
                  )}
                  <Link to={`/submissions/${sub._id}/analysis`}>
                    <Button variant="outline" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
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

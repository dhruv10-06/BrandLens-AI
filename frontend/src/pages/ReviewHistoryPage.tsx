import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewApi } from '../api/review.api.ts';
import { ReviewDecision } from '../types/index.ts';
import { Button } from '../components/common/Button.tsx';
import { History, ArrowRight, User, Clock, ShieldCheck } from 'lucide-react';

export const ReviewHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ReviewDecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await reviewApi.getReviewHistory();
      setHistory(res.history);
    } catch (err) {
      console.error('Failed to load review history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-forest-100 text-forest-900 border border-forest-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
            <span>Approved &amp; Released</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-oxblood-100 text-oxblood-900 border border-oxblood-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-oxblood-800" />
            <span>Rejected</span>
          </span>
        );
      case 'requested_changes':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brass-100 text-brass-900 border border-brass-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-brass-800" />
            <span>Changes Requested</span>
          </span>
        );
      default:
        return <span className="text-xs font-mono">{decision}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2D7C5]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EFE4] border border-[#DDD2BF] text-forest-900 text-[11px] font-bold uppercase tracking-widest font-mono">
            <History className="w-3.5 h-3.5 text-brass-700" />
            <span>Immutable Governance Audit Trail</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-espresso-950 tracking-tight">
            Brand Review Decisions
          </h1>
          <p className="text-xs sm:text-sm text-espresso-700">
            Historical record of human reviewer sign-off determinations, justifications, and publication authorizations.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchHistory}>
          Refresh History
        </Button>
      </div>

      {/* History List */}
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-espresso-600 font-mono">Loading governance audit trail...</div>
        ) : history.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F5EFE4] border border-[#DDD2BF] text-espresso-600 mx-auto flex items-center justify-center">
              <History className="w-6 h-6 text-brass-700" />
            </div>
            <h3 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
              No Review Decisions Recorded
            </h3>
            <p className="text-xs text-espresso-700 max-w-sm mx-auto leading-relaxed">
              When brand reviewers approve, request changes, or reject submissions, audit logs will be permanently preserved here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE6D8]">
            {history.map((record) => (
              <div
                key={record._id}
                className="p-5 sm:px-8 hover:bg-[#F5EFE4]/60 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold font-serif text-espresso-950 tracking-tight">
                      {record.submissionId?.title || 'Submission Record'}
                    </span>
                    {getDecisionBadge(record.decision)}
                  </div>

                  <div className="text-[11px] text-espresso-600 flex items-center gap-3 font-mono">
                    <span className="flex items-center gap-1 text-espresso-800">
                      <User className="w-3.5 h-3.5 text-brass-700" />
                      Auditor: {record.reviewerId?.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brass-700" />
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {record.comments && (
                  <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD2BF] text-xs text-espresso-800 leading-relaxed font-sans">
                    <span className="font-bold text-espresso-950 font-mono text-[11px]">Reviewer Notes: </span>
                    <span className="italic font-serif">"{record.comments}"</span>
                  </div>
                )}

                {record.submissionId?._id && (
                  <div className="flex justify-end pt-1">
                    <Link
                      to={`/review/${record.submissionId._id}`}
                      className="text-xs font-semibold text-forest-800 hover:text-forest-900 flex items-center gap-1 transition-colors font-mono underline underline-offset-2"
                    >
                      <span>Inspect Audit Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
